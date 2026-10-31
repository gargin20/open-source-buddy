import github from '../github/index.js';

export async function buildContext(issue) {
  if (!issue || !issue.repo) return '';
  const [owner, name] = issue.repo.split('/');
  if (!owner || !name) return '';

  let context = '';
  try {
    const readme = await github.getRepoFile(owner, name, 'README.md');
    if (readme) context += `README:\n${readme.slice(0, 2000)}\n\n`;
  } catch {}

  try {
    const contributing = await github.getRepoFile(owner, name, 'CONTRIBUTING.md');
    if (contributing) context += `CONTRIBUTING:\n${contributing.slice(0, 2000)}\n\n`;
  } catch {}

  return context.trim();
}
