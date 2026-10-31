import { AIProvider } from './provider.js';
import { config } from '../config.js';

// Build the prompt sent to the local model.
function buildPrompt(issue, context) {
  const labels = (issue.labels || []).join(', ') || 'none';
  const body = String(issue.body || '').trim() || 'No description provided.';
  const contextSection = context ? `\n\nExtra context:\n${context}` : '';

  return `You are a helpful open-source mentor. A contributor needs help understanding a GitHub issue.

Issue title: ${issue.title}
Repository: ${issue.repo || 'unknown'}
Labels: ${labels}
Language: ${issue.language || 'unknown'}
Description:
${body}${contextSection}

Respond in valid JSON with exactly this shape:
{
  "summary": "<plain-English explanation of the issue in 2-3 sentences>",
  "files": ["<likely file or folder 1>", "<likely file or folder 2>"],
  "plan": [
    "<step 1>",
    "<step 2>",
    "<step 3>",
    "<step 4>"
  ]
}

Only output the JSON object. Do not add any text before or after it.`;
}

// Parse the model's JSON response into { markdown, plan }.
function parseResponse(raw, issue) {
  let parsed;
  try {
    // Ollama sometimes wraps the JSON in a markdown code fence — strip it.
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    // Fallback: use the raw text as the summary if JSON parsing fails.
    parsed = { summary: raw.trim(), files: [], plan: [] };
  }

  const summary = parsed.summary || 'No summary provided.';
  const files = Array.isArray(parsed.files) ? parsed.files : [];
  const plan = Array.isArray(parsed.plan) ? parsed.plan : [];

  const markdown = [
    `# Explaining: ${issue.title}`,
    '',
    '## In plain English',
    summary,
    '',
    ...(files.length
      ? ['## Likely files', ...files.map((f) => `- \`${f}\``), '']
      : []),
    '## Starting plan',
    ...plan.map((step, i) => `${i + 1}. ${step}`),
  ].join('\n');

  return { markdown, plan };
}

export class OllamaProvider extends AIProvider {
  get name() {
    return 'ollama';
  }

  async explain(issue, { context } = {}) {
    const url = `${config.ollamaUrl}/api/generate`;
    const prompt = buildPrompt(issue, context);

    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.ollamaModel,
          prompt,
          stream: false,
          format: 'json',
        }),
      });
    } catch (err) {
      throw new Error(
        `Cannot reach Ollama at ${config.ollamaUrl}. ` +
          'Make sure Ollama is running ("ollama serve") and OLLAMA_URL is correct. ' +
          `Original error: ${err.message}`
      );
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(
        `Ollama returned HTTP ${res.status}. ` +
          (body ? `Details: ${body.slice(0, 200)}` : 'No response body.')
      );
    }

    const data = await res.json();
    const raw = data.response ?? '';

    return parseResponse(raw, issue);
  }
}
