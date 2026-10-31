// In-memory cache for GitHub provider responses.
//
// Every cached entry lives for 5 minutes by default. Set GITHUB_CACHE_TTL_MS
// to change the TTL. Expired entries are removed the next time they are read.
export const DEFAULT_TTL_MS = 5 * 60 * 1000;

function stableKey(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableKey).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableKey(value[key])}`).join(',')}}`;
}

export function createCacheMeta() {
  return { hits: 0, misses: 0 };
}

export function cacheStatus(meta) {
  if (!meta || (meta.hits === 0 && meta.misses === 0)) return 'BYPASS';
  return meta.misses > 0 ? 'MISS' : 'HIT';
}

export function withCache(provider, { ttlMs = DEFAULT_TTL_MS, now = Date.now } = {}) {
  const entries = new Map();

  function read(key) {
    const entry = entries.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= now()) {
      entries.delete(key);
      return null;
    }
    return entry;
  }

  function write(key, value) {
    entries.set(key, { value, expiresAt: now() + ttlMs });
  }

  async function cached(key, load, meta) {
    const entry = read(key);
    if (entry) {
      if (meta) meta.hits += 1;
      return entry.value;
    }

    if (meta) meta.misses += 1;
    const value = await load();
    write(key, value);
    return value;
  }

  return {
    get name() {
      return provider.name;
    },
    ttlMs,
    listIssues(params = {}, meta) {
      const key = `listIssues:${stableKey(params)}`;
      return cached(key, () => provider.listIssues(params), meta);
    },
    getRepoHealth(owner, name, meta) {
      const key = `getRepoHealth:${String(owner).toLowerCase()}/${String(name).toLowerCase()}`;
      return cached(key, () => provider.getRepoHealth(owner, name), meta);
    },
    getRepoFile(owner, name, filePath, meta) {
      const key = `getRepoFile:${String(owner).toLowerCase()}/${String(name).toLowerCase()}:${filePath}`;
      return cached(key, () => provider.getRepoFile(owner, name, filePath), meta);
    },
    clearCache() {
      entries.clear();
    },
  };
}
