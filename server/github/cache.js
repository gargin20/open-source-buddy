/**
 * In-memory TTL cache for GitHub provider responses.
 *
 * TTLs (all configurable via the TTL_* exports):
 *   listIssues    → 5 minutes  (search results change moderately often)
 *   getRepoHealth → 10 minutes (health metrics are expensive + slow-moving)
 *   getRepoFile   → 15 minutes (file contents rarely change mid-session)
 *
 * Cache keys include every parameter that affects the response so different
 * queries never share a cached result.
 *
 * Usage:
 *   import { withCache } from './cache.js';
 *   const cachedProvider = withCache(rawProvider);
 *   // cachedProvider has the same interface as GitHubProvider
 *   // Each method resolves with { ...result, cached: true|false }
 */

// ── TTL constants (milliseconds) ───────────────────────────────────────────
export const TTL_LIST_ISSUES   = 5  * 60 * 1000; //  5 min
export const TTL_REPO_HEALTH   = 10 * 60 * 1000; // 10 min
export const TTL_REPO_FILE     = 15 * 60 * 1000; // 15 min

// ── Internal cache store ───────────────────────────────────────────────────

/**
 * Each entry: { value: any, expiresAt: number (ms epoch) }
 * Stored in a plain Map — no external dependencies.
 */
class TTLCache {
  constructor() {
    this._store = new Map();
  }

  /**
   * Build a deterministic string key from an array of parts.
   * All parts are JSON-serialised so objects/arrays are handled correctly.
   */
  static makeKey(...parts) {
    return parts.map((p) => JSON.stringify(p)).join('::');
  }

  /** Returns the cached value or undefined if missing / expired. */
  get(key) {
    const entry = this._store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this._store.delete(key); // lazy eviction
      return undefined;
    }
    return entry.value;
  }

  /** Stores a value with the given TTL (milliseconds). */
  set(key, value, ttl) {
    this._store.set(key, { value, expiresAt: Date.now() + ttl });
  }

  /** Returns true when a non-expired entry exists for the key. */
  has(key) {
    return this.get(key) !== undefined;
  }

  /** Removes a single entry. */
  delete(key) {
    this._store.delete(key);
  }

  /** Clears all entries — useful in tests. */
  clear() {
    this._store.clear();
  }

  /** Number of live (non-expired) entries. */
  get size() {
    // Sweep expired entries first so the count is accurate.
    for (const [key, entry] of this._store) {
      if (Date.now() > entry.expiresAt) this._store.delete(key);
    }
    return this._store.size;
  }
}

// ── Caching proxy ──────────────────────────────────────────────────────────

/**
 * Wraps any GitHubProvider with a caching layer.
 *
 * @param {import('./provider.js').GitHubProvider} provider
 * @param {TTLCache} [cache]  Inject a cache instance (useful in tests).
 * @returns A provider-compatible object whose methods return responses
 *          augmented with a `cached` boolean field.
 */
export function withCache(provider, cache = new TTLCache()) {
  return {
    /** Expose the underlying provider name so callers can identify it. */
    get name() {
      return provider.name;
    },

    /** Expose the cache instance so tests (and routes) can inspect it. */
    _cache: cache,

    /**
     * listIssues({ q, language, topic })
     * Cache key: all three filter parameters.
     * TTL: TTL_LIST_ISSUES (5 min)
     */
    async listIssues(params = {}) {
      const { q = '', language = '', topic = '' } = params;
      const key = TTLCache.makeKey('listIssues', q, language, topic);

      const hit = cache.get(key);
      if (hit !== undefined) {
        return { items: hit, cached: true };
      }

      const items = await provider.listIssues({ q, language, topic });
      cache.set(key, items, TTL_LIST_ISSUES);
      return { items, cached: false };
    },

    /**
     * getRepoHealth(owner, name)
     * Cache key: owner + name.
     * TTL: TTL_REPO_HEALTH (10 min)
     */
    async getRepoHealth(owner, name) {
      const key = TTLCache.makeKey('getRepoHealth', owner, name);

      const hit = cache.get(key);
      if (hit !== undefined) {
        return { ...hit, cached: true };
      }

      const result = await provider.getRepoHealth(owner, name);
      if (result !== null) {
        cache.set(key, result, TTL_REPO_HEALTH);
      }
      return result === null ? null : { ...result, cached: false };
    },

    /**
     * getRepoFile(owner, name, filePath)
     * Cache key: owner + name + filePath.
     * TTL: TTL_REPO_FILE (15 min)
     */
    async getRepoFile(owner, name, filePath) {
      const key = TTLCache.makeKey('getRepoFile', owner, name, filePath);

      const hit = cache.get(key);
      if (hit !== undefined) {
        // hit is the raw string (or null sentinel)
        return hit === '__null__' ? null : hit;
      }

      const result = await provider.getRepoFile(owner, name, filePath);
      // Store a sentinel for null so we can distinguish "not cached" from
      // "cached null" (e.g. file not found).
      cache.set(key, result === null ? '__null__' : result, TTL_REPO_FILE);
      return result;
    },
  };
}

// Export TTLCache so tests can create fresh instances.
export { TTLCache };
