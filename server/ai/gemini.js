import { AIProvider } from './provider.js';
import { config } from '../config.js';

export class GeminiProvider extends AIProvider {
  get name() {
    return 'gemini';
  }

  async explain(issue, { context = '' } = {}) {
    const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured on the server.');
    }

    const prompt = `You are an open source mentor. Explain this issue and provide a step-by-step contribution plan.
Issue Title: ${issue.title}
Repository: ${issue.repo}
Description: ${issue.body || 'No description'}
${context ? `Repository Context:\n${context}\n` : ''}

Respond in markdown with:
# Explaining: ${issue.title}
## In plain English
<summary>
## Likely files
<bullet points of files>
## Starting plan
1. <step 1>
2. <step 2>
3. <step 3>`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error?.message || `Gemini API request failed (${res.status})`);
    }

    const data = await res.json();
    const markdown = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No explanation generated.';

    const plan = [];
    const planMatches = markdown.match(/^\d+\.\s+(.+)$/gm);
    if (planMatches) {
      for (const m of planMatches) {
        plan.push(m.replace(/^\d+\.\s+/, '').trim());
      }
    }
    if (plan.length === 0) {
      plan.push('Fork and clone the repository.', 'Run the project locally.', 'Create a branch and implement the fix.');
    }

    return { issueTitle: issue.title, markdown, plan };
  }
}
