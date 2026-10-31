import { AIProvider } from './provider.js';

const DEFAULT_GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash';
const DEFAULT_TIMEOUT_MS = 120000;

export class GeminiAIProvider extends AIProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'gemini';
    this.apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
    this.baseUrl = (
      config.geminiBaseUrl ||
      process.env.GEMINI_BASE_URL ||
      DEFAULT_GEMINI_BASE_URL
    ).replace(/\/+$/, '');
    this.model =
      config.geminiModel ||
      process.env.GEMINI_MODEL ||
      DEFAULT_GEMINI_MODEL;
    this.timeoutMs = Number(
      config.geminiTimeoutMs ||
      process.env.GEMINI_TIMEOUT_MS ||
      DEFAULT_TIMEOUT_MS
    );
  }

  get name() {
    return this._name || 'gemini';
  }

  set name(val) {
    this._name = val;
  }

  async explain(issue, opts = {}) {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is required when AI_PROVIDER=gemini.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let response;

    try {
      response = await fetch(
        `${this.baseUrl}/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: buildPrompt(issue, opts),
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: opts.temperature ?? 0.2,
              responseMimeType: 'application/json',
              maxOutputTokens: 2048,
            },
          }),
          signal: controller.signal,
        }
      );
    } catch (error) {
      clearTimeout(timeout);
      throw new Error(
        `Could not connect to Gemini. Check GEMINI_BASE_URL and network access. ${error.message}`
      );
    }

    clearTimeout(timeout);

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(
        `Gemini request failed with HTTP ${response.status} ${response.statusText}` +
          (detail ? `: ${detail}` : '')
      );
    }

    const data = await response.json();
    const text = Array.isArray(data?.candidates?.[0]?.content?.parts)
      ? data.candidates[0].content.parts.map((part) => part.text || '').join('')
      : '';

    if (!text.trim()) {
      throw new Error('Gemini returned an empty explanation.');
    }

    return normalizeExplanation(text);
  }
}

function buildPrompt(issue, opts = {}) {
  const labels = Array.isArray(issue?.labels)
    ? issue.labels.map((label) => label?.name || label).filter(Boolean).join(', ')
    : '';

  return [
    'You help beginners make their first open-source contribution.',
    'Return only valid JSON with exactly these keys:',
    '{"markdown": string, "plan": string[]}',
    'The markdown should be useful Markdown.',
    'The plan should contain 3 to 6 concise next steps.',
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

export { GeminiAIProvider as GeminiProvider };
