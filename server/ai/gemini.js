import { AIProvider } from './provider.js';
import { config } from '../config.js';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
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

export class GeminiProvider extends AIProvider {
  get name() {
    return 'gemini';
  }

  async explain(issue, { context } = {}) {
    if (!config.geminiApiKey) {
      const error = new Error(
        'Gemini is not configured. Add GEMINI_API_KEY to .env and restart the server.',
      );
      error.status = 500;
      throw error;
    }

    let response;
    try {
      response = await fetch(`${ENDPOINT}/${encodeURIComponent(config.geminiModel)}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': config.geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: buildPrompt(issue, context) }] }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
        }),
        signal: AbortSignal.timeout(30000),
      });
    } catch (err) {
      const error = new Error(`Could not reach Gemini: ${err.message}`);
      error.status = 502;
      throw error;
    }

    if (!response.ok) {
      let detail = '';
      try {
        const data = await response.json();
        detail = data?.error?.message || '';
      } catch {
        // Keep the status code only.
      }
      const error = new Error(
        `Gemini request failed (${response.status})${detail ? `: ${detail}` : ''}`,
      );
      error.status = response.status === 429 ? 429 : 502;
      throw error;
    }

    const data = await response.json();
    const text = (data.candidates?.[0]?.content?.parts || [])
      .map((part) => part.text)
      .filter(Boolean)
      .join('\n')
      .trim();

    if (!text) {
      const error = new Error('Gemini returned an empty explanation. Try again.');
      error.status = 502;
      throw error;
    }

    const result = parseResult(text);
    if (!result) {
      const error = new Error('Gemini returned a response that could not be read. Try again.');
      error.status = 502;
      throw error;
    }

    return result;
  }
}
