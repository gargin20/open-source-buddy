const TTL_MS = 5 * 60 * 1000; // 5 minutes

export function withCache(provider) {
  const cache = new Map();

  function get(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      cache.delete(key);
      return null;
    }
    return entry.value;
  }

  function set(key, value) {
    cache.set(key, { value, expiresAt: Date.now() + TTL_MS });
  }

  return {
    get name() {
      return provider.name;
    },
    async listIssues(params = {}) {
      const key = `issues:${JSON.stringify(params)}`;
      const cached = get(key);
      if (cached) return cached;
      const res = await provider.listIssues(params);
      set(key, res);
      return res;
    },
    async getRepoHealth(repo) {
      const key = `health:${repo}`;
      const cached = get(key);
      if (cached) return cached;
      const res = await provider.getRepoHealth(repo);
      set(key, res);
      return res;
    },
    async getRepoFile(repo, filepath) {
      const key = `file:${repo}:${filepath}`;
      const cached = get(key);
      if (cached) return cached;
      const res = await provider.getRepoFile(repo, filepath);
      set(key, res);
      return res;
    },
  };
}
