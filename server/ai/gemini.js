import { AIProvider } from './provider.js';
import { config } from '../config.js';

function extractPlanSteps(text) {
  const steps = [];
  const lines = String(text || '').split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*(?:\d+[.)]|-|\*)\s+(.+)$/);
    if (match) {
      steps.push(match[1].trim());
    }
  }
  return steps.length
    ? steps.slice(0, 8)
    : [
        'Fork the repository and clone your fork locally.',
        'Read CONTRIBUTING.md and run the project locally.',
        'Locate the relevant source files and reproduce the issue.',
        'Implement the smallest change that solves the issue on a new branch.',
        'Test your changes thoroughly.',
        'Submit a pull request referencing the issue number.',
      ];
}

export class GeminiProvider extends AIProvider {
  constructor({ apiKey, model } = {}) {
    super();
    this.apiKey = apiKey ?? config.geminiApiKey;
    this.model = model ?? config.geminiModel ?? 'gemini-1.5-flash';
  }

  get name() {
    return 'gemini';
  }

  async explain(issue, { context } = {}) {
    if (!this.apiKey) {
      const error = new Error('GEMINI_API_KEY is not set. Add it to your .env file to use the Gemini provider.');
      error.status = 500;
      throw error;
    }

    const prompt = [
      'You are an empathetic, expert open-source mentor helping a beginner contributor understand a GitHub issue and make their first contribution.',
      '',
      `Repository: ${issue.repo || 'unknown'}`,
      `Issue Number: #${issue.number ?? 'N'}`,
      `Issue Title: ${issue.title}`,
      `Labels: ${(issue.labels || []).join(', ') || 'none'}`,
      `Language: ${issue.language || 'not specified'}`,
      `Topics: ${(issue.topics || []).join(', ') || 'none'}`,
      '',
      'Issue Description:',
      '"""',
      issue.body || 'No description provided.',
      '"""',
      context ? `\nAdditional Repository Context:\n"""\n${context}\n"""` : '',
      '',
      'Respond with a JSON object containing two keys: "markdown" and "plan".',
      'The "markdown" key MUST be a Markdown formatted string with the following sections:',
      `# Explaining: ${issue.title}`,
      '',
      '## In plain English',
      'Explain what the issue is asking for in simple terms without heavy jargon.',
      '',
      '## Likely files',
      'List bullet points of files or directories in the codebase likely involved in this change.',
      '',
      '## Starting plan',
      'Provide clear, sequential guidance for a beginner on how to approach, test, and resolve the issue.',
      '',
      'The "plan" key MUST be an array of strings, where each element is an actionable, concise step.',
      '',
      'Return ONLY a valid JSON object matching this structure:',
      '{',
      '  "markdown": "string",',
      '  "plan": ["string", "string", ...]',
      '}',
    ].join('\n');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      this.model,
    )}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const payload = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    };

    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (netErr) {
      const error = new Error(`Could not connect to Gemini API: ${netErr.message}`);
      error.status = 502;
      throw error;
    }

    if (!res.ok) {
      let errorMessage = `Gemini API responded with status ${res.status}`;
      try {
        const errorBody = await res.json();
        if (errorBody?.error?.message) {
          errorMessage = `Gemini API error (${res.status}): ${errorBody.error.message}`;
        }
      } catch {
        // response had no json body
      }

      if (res.status === 401 || res.status === 403) {
        errorMessage = 'Invalid or unauthorized GEMINI_API_KEY. Please verify your API key in .env.';
      } else if (res.status === 429) {
        errorMessage = 'Gemini API quota exceeded or rate limited. Please try again shortly.';
      }

      const error = new Error(errorMessage);
      error.status = res.status >= 400 && res.status < 500 ? res.status : 502;
      throw error;
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const candidateText = candidate?.content?.parts?.[0]?.text;

    if (!candidateText) {
      const error = new Error('Gemini API returned an empty or invalid response.');
      error.status = 502;
      throw error;
    }

    let parsed;
    try {
      const cleaned = candidateText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        markdown: candidateText,
        plan: extractPlanSteps(candidateText),
      };
    }

    const markdown =
      typeof parsed.markdown === 'string' && parsed.markdown.trim()
        ? parsed.markdown
        : candidateText;

    const plan =
      Array.isArray(parsed.plan) && parsed.plan.length
        ? parsed.plan.map(String)
        : extractPlanSteps(markdown);

    return {
      issueTitle: issue.title,
      markdown,
      plan,
    };
  }
}
