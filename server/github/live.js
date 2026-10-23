import { GitHubProvider } from './provider.js';

const API = 'https://api.github.com';
const DAY = 24 * 60 * 60 * 1000;

// Talks to the real GitHub REST API. Works without a token (60 requests/hour);
// set GITHUB_TOKEN in .env for more.
export class LiveGitHubProvider extends GitHubProvider {
  constructor(token = '') {
    super();
    this.token = token;
    this.repoCache = new Map();
  }

  get name() {
    return 'live';
  }

  async request(url, { allow404 = false } = {}) {
    const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'open-source-buddy' };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    let res;
    try {
      res = await fetch(url.startsWith('http') ? url : `${API}${url}`, { headers });
    } catch (err) {
      const e = new Error(`Could not reach GitHub: ${err.message}`);
      e.status = 502;
      throw e;
    }
    if (allow404 && res.status === 404) return null;
    if (!res.ok) {
      const e = new Error(
        res.status === 403 || res.status === 429
          ? 'GitHub rate limit reached. Try again later or set GITHUB_TOKEN.'
          : `GitHub responded with ${res.status}`,
      );
      e.status = res.status === 403 || res.status === 429 ? 429 : 502;
      throw e;
    }
    return res.json();
  }

  async getRepoInfo(fullName) {
    if (!this.repoCache.has(fullName)) {
      const info = await this.request(`/repos/${fullName}`, { allow404: true }).catch(() => null);
      this.repoCache.set(fullName, info);
    }
    return this.repoCache.get(fullName);
  }

  async listIssues({ q = '', language = '', topic = '' } = {}) {
    const parts = ['is:issue', 'is:open', 'label:"good first issue"'];
    if (q) parts.push(q);
    if (language) parts.push(`language:${language}`);
    if (topic) parts.push(`topic:${topic}`);
    const data = await this.request(`/search/issues?q=${encodeURIComponent(parts.join(' '))}&per_page=100`);

    const repoNames = [...new Set(data.items.map((i) => i.repository_url.replace(`${API}/repos/`, '')))];
    await Promise.all(repoNames.map((name) => this.getRepoInfo(name)));

    return data.items.map((item) => {
      const repo = item.repository_url.replace(`${API}/repos/`, '');
      const info = this.repoCache.get(repo);
      return {
        id: item.id,
        number: item.number,
        title: item.title,
        body: item.body || '',
        repo,
        url: item.html_url,
        labels: item.labels.map((l) => l.name),
        language: info?.language || null,
        topics: info?.topics || [],
        comments: item.comments,
        createdAt: item.created_at,
      };
    });
  }

  async getRepoHealth(owner, name) {
    const info = await this.getRepoInfo(`${owner}/${name}`);
    if (!info) return null;

    const pulls = await this.request(
      `/repos/${owner}/${name}/pulls?state=closed&sort=updated&direction=desc&per_page=30`,
    );
    const merged = pulls.filter((pr) => pr.merged_at);
    const now = Date.now();

    const lastMergedPrDays = merged.length
      ? Math.floor((now - new Date(merged[0].merged_at).getTime()) / DAY)
      : 999;
    const mergedPrs30d = merged.filter((pr) => now - new Date(pr.merged_at).getTime() < 30 * DAY).length;

    // Proxy for "maintainer response time": average hours from open to close of recent PRs.
    const recent = pulls.slice(0, 10);
    const responseHours = recent.length
      ? Math.round(
          recent.reduce((sum, pr) => sum + (new Date(pr.closed_at) - new Date(pr.created_at)), 0) /
            recent.length /
            (60 * 60 * 1000),
        )
      : 999;

    const contributing = await this.request(`/repos/${owner}/${name}/contents/CONTRIBUTING.md`, {
      allow404: true,
    });

    return { lastMergedPrDays, responseHours, mergedPrs30d, hasContributing: Boolean(contributing) };
  }

  async getRepoFile(owner, name, filePath) {
    const file = await this.request(`/repos/${owner}/${name}/contents/${filePath}`, { allow404: true });
    if (!file || !file.content) return null;
    return Buffer.from(file.content, 'base64').toString('utf8');
  }
}
