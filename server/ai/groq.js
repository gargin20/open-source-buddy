import { AIProvider } from './provider.js';

const DEFAULT_GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_TIMEOUT_MS = 120000;

export class GroqAIProvider extends AIProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'groq';
    this.apiKey = config.groqApiKey || process.env.GROQ_API_KEY;
    this.baseUrl = (
      config.groqBaseUrl ||
      process.env.GROQ_BASE_URL ||
      DEFAULT_GROQ_BASE_URL
    ).replace(/\/+$/, '');
    this.model =
      config.groqModel ||
      process.env.GROQ_MODEL ||
      DEFAULT_GROQ_MODEL;
    this.timeoutMs = Number(
      config.groqTimeoutMs ||
      process.env.GROQ_TIMEOUT_MS ||
      DEFAULT_TIMEOUT_MS
    );
  }

  get name() {
    return this._name || 'groq';
  }

  set name(val) {
    this._name = val;
  }

  async explain(issue, opts = {}) {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY is required when AI_PROVIDER=groq.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let response;

    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          temperature: opts.temperature ?? 0.2,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'You help beginners make their first open-source contribution. ' +
                'Return only valid JSON with exactly these keys: ' +
                '{"markdown": string, "plan": string[]}. ' +
                'The markdown should be useful Markdown. The plan should contain 3 to 6 concise next steps.',
            },
            {
              role: 'user',
              content: buildPrompt(issue, opts),
            },
          ],
        }),
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timeout);
      throw new Error(
        `Could not connect to Groq. Check GROQ_BASE_URL and network access. ${error.message}`
      );
    }

    clearTimeout(timeout);

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(
        `Groq request failed with HTTP ${response.status} ${response.statusText}` +
          (detail ? `: ${detail}` : '')
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('Groq returned an empty explanation.');
    }

    return normalizeExplanation(content);
  }
}

function buildPrompt(issue, opts = {}) {
  const labels = Array.isArray(issue?.labels)
    ? issue.labels.map((label) => label?.name || label).filter(Boolean).join(', ')
    : '';

  return [
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

function normalizeExplanation(content) {
  const raw = content.trim();

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.markdown === 'string' && Array.isArray(parsed.plan)) {
      return {
        markdown: parsed.markdown,
        plan: parsed.plan.map((item) => String(item)),
      };
    }
  } catch {
    // Fall through to a safe text-based result.
  }

  return {
    markdown: raw,
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
        'Identify the likely source file or module.',
        'Make the smallest useful change and run tests.',
      ];
}

export { GroqAIProvider as GroqProvider };
