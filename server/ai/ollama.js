import { AIProvider } from './provider.js';
import { config } from '../config.js';

const MAX_CONTEXT_CHARS = 8000;

function buildPrompt(issue, context) {
  const labels = (issue.labels || []).join(', ') || 'none';
  const topics = (issue.topics || []).join(', ') || 'none';
  const body = String(issue.body || '').slice(0, 4000) || 'No description yet.';
  const extra = String(context || '').slice(0, MAX_CONTEXT_CHARS);

  return [
    'You help a beginner start their first open source contribution.',
    'Return only JSON with this exact shape:',
    '{"markdown":"string","plan":["step 1","step 2"]}',
    'The markdown must contain these sections: "## In plain English", "## Likely files", "## Starting plan".',
    'The plan must contain 4 to 6 short, actionable steps.',
    'Do not invent files. If no file is mentioned, say the location is a guess.',
    '',
    `Repository: ${issue.repo || 'unknown'}`,
    `Language: ${issue.language || 'unknown'}`,
    `Topics: ${topics}`,
    `Labels: ${labels}`,
    `Issue title: ${issue.title || 'untitled'}`,
    `Issue body: ${body}`,
    extra ? `Repository context:\n${extra}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function parseResult(text) {
  const clean = String(text)
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  const candidates = [clean];
  if (start !== -1 && end > start) candidates.push(clean.slice(start, end + 1));

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (
        typeof parsed.markdown === 'string' &&
        parsed.markdown.trim() &&
        Array.isArray(parsed.plan) &&
        parsed.plan.length
      ) {
        return { markdown: parsed.markdown.trim(), plan: parsed.plan.map(String) };
      }
    } catch {
      // Try the next candidate.
    }
  }
  return null;
}

export class OllamaProvider extends AIProvider {
  get name() {
    return 'ollama';
  }

  async explain(issue, { context } = {}) {
    const baseUrl = config.ollamaUrl.replace(/\/+$/, '');
    let response;

    try {
      response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.ollamaModel,
          messages: [{ role: 'user', content: buildPrompt(issue, context) }],
          stream: false,
          format: 'json',
          options: { temperature: 0.2 },
        }),
        signal: AbortSignal.timeout(120000),
      });
    } catch {
      const error = new Error(
        `Could not reach Ollama at ${baseUrl}. Start it with "ollama serve" and check OLLAMA_URL.`,
      );
      error.status = 502;
      throw error;
    }

    if (!response.ok) {
      let detail = '';
      try {
        const data = await response.json();
        detail = data?.error || '';
      } catch {
        // Keep the status code only.
      }
      const error = new Error(
        `Ollama request failed (${response.status})${detail ? `: ${detail}` : ''}`,
      );
      error.status = 502;
      throw error;
    }

    const data = await response.json();
    const text = String(data?.message?.content || '').trim();

    if (!text) {
      const error = new Error('Ollama returned an empty explanation. Try again.');
      error.status = 502;
      throw error;
    }

    const result = parseResult(text);
    if (!result) {
      const error = new Error('Ollama returned a response that could not be read. Try again.');
      error.status = 502;
      throw error;
    }

    return result;
  }
}
