import { AIProvider } from './provider.js';

const DEFAULT_OLLAMA_BASE_URL = 'http://127.0.0.1:11434';
const DEFAULT_OLLAMA_MODEL = 'llama3.2';
const DEFAULT_OLLAMA_TIMEOUT_MS = 120000;

export class OllamaAIProvider extends AIProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'ollama';
    this.baseUrl = (
      config.ollamaBaseUrl ||
      config.ollamaUrl ||
      process.env.OLLAMA_BASE_URL ||
      process.env.OLLAMA_URL ||
      DEFAULT_OLLAMA_BASE_URL
    ).replace(/\/+$/, '');
    this.model =
      config.ollamaModel ||
      process.env.OLLAMA_MODEL ||
      DEFAULT_OLLAMA_MODEL;
    this.timeoutMs = Number(
      config.ollamaTimeoutMs ||
      process.env.OLLAMA_TIMEOUT_MS ||
      DEFAULT_OLLAMA_TIMEOUT_MS
    );
  }

  get name() {
    return this._name || 'ollama';
  }

  set name(val) {
    this._name = val;
  }

  async explain(issue, opts = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let response;
    try {
      response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: buildPrompt(issue, opts),
          stream: false,
          format: 'json',
          options: {
            temperature: opts.temperature ?? 0.2,
          },
        }),
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timeout);
      throw new Error(
        `Could not connect to Ollama at ${this.baseUrl}. ` +
        `Make sure Ollama is running and reachable. ${error.message}`
      );
    }

    clearTimeout(timeout);

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(
        `Ollama request failed with HTTP ${response.status} ${response.statusText}` +
          (detail ? `: ${detail}` : '')
      );
    }

    const data = await response.json();
    return normalizeOllamaResult(data);
  }
}

function buildPrompt(issue, opts = {}) {
  const labels = Array.isArray(issue?.labels)
    ? issue.labels.map((label) => label?.name || label).filter(Boolean).join(', ')
    : '';

  return [
    'You help beginners make their first open-source contribution.',
    'Return only a JSON object with exactly these keys:',
    '{"markdown": string, "plan": string[]}',
    'The markdown should explain the issue in clear Markdown.',
    'The plan should contain 3 to 6 concrete next steps.',
    '',
    `Title: ${issue?.title || 'Untitled issue'}`,
    `Labels: ${labels || 'none'}`,
    `URL: ${issue?.html_url || issue?.url || 'not provided'}`,
    '',
    'Issue body:',
    issue?.body || 'No issue body provided.',
    '',
    `Preferred style: ${opts.mode || 'beginner'}`,
  ].join('\n');
}

function normalizeOllamaResult(data) {
  const raw = typeof data?.response === 'string' ? data.response.trim() : '';

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed.markdown === 'string' &&
        Array.isArray(parsed.plan)
      ) {
        return {
          markdown: parsed.markdown,
          plan: parsed.plan.map((item) => String(item)),
        };
      }
    } catch {
      // Fall through to a safe text-based result.
    }
  }

  return {
    markdown: raw || 'Ollama did not return an explanation.',
    plan: extractPlan(raw),
  };
}

function extractPlan(text) {
  const plan = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+|^\d+\.\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+|^\d+\.\s+/, '').trim())
    .filter(Boolean);

  return plan.length > 0
    ? plan
    : [
        'Read the issue title, labels, and body.',
        'Find the likely file or module to change.',
        'Make the smallest useful change and run tests.',
      ];
}

export { OllamaAIProvider as OllamaProvider };
