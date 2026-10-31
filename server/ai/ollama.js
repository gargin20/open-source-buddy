import { AIProvider } from './provider.js';
import { config } from '../config.js';

export class OllamaProvider extends AIProvider {
  get name() {
    return 'ollama';
  }

  async explain(issue, { context = '' } = {}) {
    const baseUrl = config.ollamaUrl || process.env.OLLAMA_URL || 'http://localhost:11434';
    const model = process.env.OLLAMA_MODEL || 'llama3';

    const prompt = `Explain this GitHub issue and suggest a plan for a beginner contributor.
Title: ${issue.title}
Repo: ${issue.repo}
Body: ${issue.body || 'None'}
${context ? `Context:\n${context}\n` : ''}
Provide a step-by-step numbered plan.`;

    try {
      const res = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, stream: false }),
      });

      if (!res.ok) {
        throw new Error(`Ollama server returned ${res.status}`);
      }

      const data = await res.json();
      const markdown = data.response || 'No response from Ollama.';
      const plan = [];
      const planMatches = markdown.match(/^\d+\.\s+(.+)$/gm);
      if (planMatches) {
        for (const m of planMatches) {
          plan.push(m.replace(/^\d+\.\s+/, '').trim());
        }
      }
      if (!plan.length) {
        plan.push('Fork and clone the repository', 'Reproduce the problem', 'Submit PR with Closes #N');
      }

      return { issueTitle: issue.title, markdown, plan };
    } catch (err) {
      throw new Error(`Could not connect to Ollama at ${baseUrl}: ${err.message}`);
    }
  }
}
