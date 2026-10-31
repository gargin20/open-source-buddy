import { AIProvider } from './provider.js';

const FILE_PATTERN = /[\w./-]+\.(?:jsx?|tsx?|py|rs|go|java|css|html|md|json)\b/g;

function firstSentences(text, count = 2) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return 'The issue has no description yet.';
  return clean.split(/(?<=[.!?])\s+/).slice(0, count).join(' ');
}

function guessFiles(issue) {
  const found = [...new Set(`${issue.title} ${issue.body}`.match(FILE_PATTERN) || [])];
  if (found.length) return found.slice(0, 5);
  const labels = (issue.labels || []).map((l) => l.toLowerCase());
  if (labels.some((l) => l.includes('doc'))) return ['README.md', 'docs/'];
  return ['src/', 'README.md'];
}

// Template-based explanation. No network, no keys.
export class MockAIProvider extends AIProvider {
  get name() {
    return 'mock';
  }

  async explain(issue) {
    const labels = issue.labels || [];
    const files = guessFiles(issue);
    const friendly = labels.some((l) => l.toLowerCase().includes('good first'));
    const plan = [
      `Fork **${issue.repo}** and clone your fork.`,
      'Read CONTRIBUTING.md and run the project locally.',
      `Open ${files.map((f) => `\`${f}\``).join(', ')} and find the code the issue talks about.`,
      'Reproduce the problem (or read the current text) before changing anything.',
      'Make the smallest change that solves it, on a new branch.',
      `Open a pull request and write "Closes #${issue.number ?? 'N'}" in the description.`,
    ];

    const markdown = [
      `# Explaining: ${issue.title}`,
      '',
      '## In plain English',
      firstSentences(issue.body),
      '',
      `Labels: ${labels.length ? labels.join(', ') : 'none'}. ${
        friendly ? 'This one is marked beginner friendly.' : 'Read the discussion first to judge the effort.'
      }`,
      '',
      '## Likely files',
      ...files.map((f) => `- \`${f}\``),
      '',
      '## Starting plan',
      ...plan.map((step, i) => `${i + 1}. ${step}`),
    ].join('\n');

    return { issueTitle: issue.title, markdown, plan };
  }

  // Yield the explanation in small chunks so the browser can render it while
  // it is being written. The mock provider has no network call to stream from.
  async *explainStream(issue, opts) {
    const { markdown } = await this.explain(issue, opts);
    const parts = markdown.match(/\S+\s*/g) || [markdown];
    let buffer = '';

    for (const part of parts) {
      buffer += part;
      if (buffer.length >= 20) {
        yield buffer;
        buffer = '';
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    }
    if (buffer) yield buffer;
  }
}
