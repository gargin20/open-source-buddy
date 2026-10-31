/**
 * Tests for server/github/cache.js
 *
 * Run with:  node --test server/github/cache.test.js
 * (Node 18+ built-in test runner — no extra dependencies needed)
 */

import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { withCache, TTLCache, TTL_LIST_ISSUES, TTL_REPO_HEALTH, TTL_REPO_FILE } from './cache.js';

// ── Minimal fake provider ──────────────────────────────────────────────────

function makeFakeProvider() {
  let callCounts = { listIssues: 0, getRepoHealth: 0, getRepoFile: 0 };

  return {
    get name() { return 'fake'; },
    calls: callCounts,

    async listIssues({ q = '' } = {}) {
      callCounts.listIssues++;
      return [{ id: 1, title: `issue for q=${q}` }];
    },

    async getRepoHealth(owner, name) {
      callCounts.getRepoHealth++;
      if (owner === 'missing') return null;
      return { lastMergedPrDays: 3, responseHours: 24, mergedPrs30d: 5, hasContributing: true };
    },

    async getRepoFile(owner, name, filePath) {
      callCounts.getRepoFile++;
      if (filePath === 'missing.md') return null;
      return `content of ${filePath}`;
    },
  };
}

// ── TTLCache unit tests ────────────────────────────────────────────────────

describe('TTLCache', () => {
  it('stores and retrieves a value', () => {
    const cache = new TTLCache();
    cache.set('k', 42, 60_000);
    assert.equal(cache.get('k'), 42);
  });

  it('returns undefined for a missing key', () => {
    const cache = new TTLCache();
    assert.equal(cache.get('nope'), undefined);
  });

  it('returns undefined for an expired entry', () => {
    const cache = new TTLCache();
    cache.set('k', 'v', -1); // already expired
    assert.equal(cache.get('k'), undefined);
  });

  it('reports correct size, sweeping expired entries', () => {
    const cache = new TTLCache();
    cache.set('live', 1, 60_000);
    cache.set('dead', 2, -1);
    assert.equal(cache.size, 1);
  });

  it('has() returns false for expired entry', () => {
    const cache = new TTLCache();
    cache.set('k', 'v', -1);
    assert.equal(cache.has('k'), false);
  });

  it('clear() removes all entries', () => {
    const cache = new TTLCache();
    cache.set('a', 1, 60_000);
    cache.set('b', 2, 60_000);
    cache.clear();
    assert.equal(cache.size, 0);
  });

  it('makeKey produces different keys for different params', () => {
    const k1 = TTLCache.makeKey('listIssues', '', '', '');
    const k2 = TTLCache.makeKey('listIssues', 'react', '', '');
    assert.notEqual(k1, k2);
  });
});

// ── withCache: listIssues ──────────────────────────────────────────────────

describe('withCache — listIssues', () => {
  let provider, cached;

  beforeEach(() => {
    provider = makeFakeProvider();
    cached = withCache(provider, new TTLCache());
  });

  it('returns cached:false on first call', async () => {
    const result = await cached.listIssues({ q: '' });
    assert.equal(result.cached, false);
    assert.equal(provider.calls.listIssues, 1);
  });

  it('returns cached:true on second call with same params', async () => {
    await cached.listIssues({ q: 'react' });
    const second = await cached.listIssues({ q: 'react' });
    assert.equal(second.cached, true);
    assert.equal(provider.calls.listIssues, 1); // provider called only once
  });

  it('calls provider again with different params (different cache key)', async () => {
    await cached.listIssues({ q: 'react' });
    await cached.listIssues({ q: 'vue' });
    assert.equal(provider.calls.listIssues, 2);
  });

  it('calls provider again after TTL expires', async () => {
    const shortCache = new TTLCache();
    const c = withCache(provider, shortCache);
    await c.listIssues({ q: '' });
    // Manually expire the entry
    shortCache._store.forEach((entry, key) => {
      shortCache._store.set(key, { ...entry, expiresAt: Date.now() - 1 });
    });
    const result = await c.listIssues({ q: '' });
    assert.equal(result.cached, false);
    assert.equal(provider.calls.listIssues, 2);
  });

  it('returns the same items on a cache hit', async () => {
    const first = await cached.listIssues({ q: 'test' });
    const second = await cached.listIssues({ q: 'test' });
    assert.deepEqual(first.items, second.items);
  });
});

// ── withCache: getRepoHealth ───────────────────────────────────────────────

describe('withCache — getRepoHealth', () => {
  let provider, cached;

  beforeEach(() => {
    provider = makeFakeProvider();
    cached = withCache(provider, new TTLCache());
  });

  it('returns cached:false on first call', async () => {
    const result = await cached.getRepoHealth('owner', 'repo');
    assert.equal(result.cached, false);
  });

  it('returns cached:true on second call', async () => {
    await cached.getRepoHealth('owner', 'repo');
    const second = await cached.getRepoHealth('owner', 'repo');
    assert.equal(second.cached, true);
    assert.equal(provider.calls.getRepoHealth, 1);
  });

  it('returns null for a missing repo (not cached)', async () => {
    const result = await cached.getRepoHealth('missing', 'repo');
    assert.equal(result, null);
    // Should not cache null — re-requesting calls the provider again
    await cached.getRepoHealth('missing', 'repo');
    assert.equal(provider.calls.getRepoHealth, 2);
  });

  it('uses separate cache keys for different repos', async () => {
    await cached.getRepoHealth('ownerA', 'repo');
    await cached.getRepoHealth('ownerB', 'repo');
    assert.equal(provider.calls.getRepoHealth, 2);
  });
});

// ── withCache: getRepoFile ─────────────────────────────────────────────────

describe('withCache — getRepoFile', () => {
  let provider, cached;

  beforeEach(() => {
    provider = makeFakeProvider();
    cached = withCache(provider, new TTLCache());
  });

  it('returns file content on first call', async () => {
    const result = await cached.getRepoFile('owner', 'repo', 'README.md');
    assert.equal(result, 'content of README.md');
  });

  it('does not call provider twice for the same file', async () => {
    await cached.getRepoFile('owner', 'repo', 'README.md');
    await cached.getRepoFile('owner', 'repo', 'README.md');
    assert.equal(provider.calls.getRepoFile, 1);
  });

  it('handles null (file not found) and caches it', async () => {
    const first = await cached.getRepoFile('owner', 'repo', 'missing.md');
    assert.equal(first, null);
    const second = await cached.getRepoFile('owner', 'repo', 'missing.md');
    assert.equal(second, null);
    // Provider should only have been called once — null is cached via sentinel
    assert.equal(provider.calls.getRepoFile, 1);
  });

  it('uses different cache keys for different paths', async () => {
    await cached.getRepoFile('owner', 'repo', 'README.md');
    await cached.getRepoFile('owner', 'repo', 'CONTRIBUTING.md');
    assert.equal(provider.calls.getRepoFile, 2);
  });
});

// ── Mock mode passthrough ──────────────────────────────────────────────────

describe('withCache — mock mode passthrough', () => {
  it('exposes the underlying provider name', () => {
    const provider = makeFakeProvider();
    const c = withCache(provider, new TTLCache());
    assert.equal(c.name, 'fake');
  });

  it('exposes _cache for inspection', () => {
    const cache = new TTLCache();
    const c = withCache(makeFakeProvider(), cache);
    assert.equal(c._cache, cache);
  });
});

// ── TTL constant sanity checks ─────────────────────────────────────────────

describe('TTL constants', () => {
  it('TTL_LIST_ISSUES is 5 minutes', () => {
    assert.equal(TTL_LIST_ISSUES, 5 * 60 * 1000);
  });
  it('TTL_REPO_HEALTH is 10 minutes', () => {
    assert.equal(TTL_REPO_HEALTH, 10 * 60 * 1000);
  });
  it('TTL_REPO_FILE is 15 minutes', () => {
    assert.equal(TTL_REPO_FILE, 15 * 60 * 1000);
  });
});
