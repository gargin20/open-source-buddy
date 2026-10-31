import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_TTL_MS, cacheStatus, createCacheMeta, withCache } from '../github/cache.js';

function makeProvider() {
  const calls = { listIssues: 0, getRepoHealth: 0, getRepoFile: 0 };
  return {
    name: 'fake',
    calls,
    async listIssues(params = {}) {
      calls.listIssues += 1;
      return [{ id: calls.listIssues, params }];
    },
    async getRepoHealth(owner, name) {
      calls.getRepoHealth += 1;
      return { repo: `${owner}/${name}`, lastMergedPrDays: 1 };
    },
    async getRepoFile(owner, name, filePath) {
      calls.getRepoFile += 1;
      return `${owner}/${name}/${filePath}`;
    },
  };
}

test('the default cache TTL is five minutes', () => {
  assert.equal(DEFAULT_TTL_MS, 5 * 60 * 1000);
});

test('listIssues is cached for identical parameters', async () => {
  const provider = makeProvider();
  const cached = withCache(provider);

  const first = await cached.listIssues({ q: 'tests' });
  const second = await cached.listIssues({ q: 'tests' });

  assert.equal(provider.calls.listIssues, 1);
  assert.equal(first, second);
});

test('listIssues keys include every request parameter', async () => {
  const provider = makeProvider();
  const cached = withCache(provider);

  await cached.listIssues({ q: 'tests' });
  await cached.listIssues({ q: 'tests', language: 'JavaScript' });
  await cached.listIssues({ q: 'tests', topic: 'web' });
  await cached.listIssues({ q: 'docs' });

  assert.equal(provider.calls.listIssues, 4);
});

test('listIssues keys do not depend on parameter order', async () => {
  const provider = makeProvider();
  const cached = withCache(provider);

  await cached.listIssues({ q: 'tests', language: 'Python', topic: 'data' });
  await cached.listIssues({ topic: 'data', language: 'Python', q: 'tests' });

  assert.equal(provider.calls.listIssues, 1);
});

test('getRepoHealth is cached per repository', async () => {
  const provider = makeProvider();
  const cached = withCache(provider);

  const first = await cached.getRepoHealth('sample-org', 'pixel-notes');
  const second = await cached.getRepoHealth('sample-org', 'pixel-notes');
  await cached.getRepoHealth('sample-org', 'tiny-compiler');

  assert.equal(provider.calls.getRepoHealth, 2);
  assert.equal(first, second);
});

test('getRepoHealth treats repository names case-insensitively', async () => {
  const provider = makeProvider();
  const cached = withCache(provider);

  await cached.getRepoHealth('Sample-Org', 'Pixel-Notes');
  await cached.getRepoHealth('sample-org', 'pixel-notes');

  assert.equal(provider.calls.getRepoHealth, 1);
});

test('getRepoFile is cached per file path', async () => {
  const provider = makeProvider();
  const cached = withCache(provider);

  await cached.getRepoFile('sample-org', 'pixel-notes', 'README.md');
  await cached.getRepoFile('sample-org', 'pixel-notes', 'README.md');
  await cached.getRepoFile('sample-org', 'pixel-notes', 'CONTRIBUTING.md');

  assert.equal(provider.calls.getRepoFile, 2);
});

test('expired entries trigger a fresh provider request', async () => {
  let now = 1000;
  const provider = makeProvider();
  const cached = withCache(provider, { ttlMs: 100, now: () => now });

  await cached.listIssues({ q: 'tests' });
  now = 1099;
  await cached.listIssues({ q: 'tests' });
  assert.equal(provider.calls.listIssues, 1);

  now = 1100;
  await cached.listIssues({ q: 'tests' });
  assert.equal(provider.calls.listIssues, 2);
});

test('failed requests are not cached', async () => {
  let attempts = 0;
  const provider = {
    name: 'flaky',
    async listIssues() {
      attempts += 1;
      if (attempts === 1) throw new Error('GitHub is down');
      return [];
    },
  };
  const cached = withCache(provider);

  await assert.rejects(cached.listIssues({ q: 'tests' }), /GitHub is down/);
  const result = await cached.listIssues({ q: 'tests' });

  assert.deepEqual(result, []);
  assert.equal(attempts, 2);
});

test('null results are cached', async () => {
  let calls = 0;
  const provider = {
    name: 'empty',
    async getRepoHealth() {
      calls += 1;
      return null;
    },
  };
  const cached = withCache(provider);

  assert.equal(await cached.getRepoHealth('missing', 'repo'), null);
  assert.equal(await cached.getRepoHealth('missing', 'repo'), null);
  assert.equal(calls, 1);
});

test('cache metadata reports hits and misses', async () => {
  const provider = makeProvider();
  const cached = withCache(provider);

  const meta = createCacheMeta();
  assert.equal(cacheStatus(meta), 'BYPASS');

  await cached.listIssues({ q: 'tests' }, meta);
  assert.deepEqual(meta, { hits: 0, misses: 1 });
  assert.equal(cacheStatus(meta), 'MISS');

  await cached.listIssues({ q: 'tests' }, meta);
  assert.deepEqual(meta, { hits: 1, misses: 1 });
  assert.equal(cacheStatus(meta), 'MISS');

  const hitMeta = createCacheMeta();
  await cached.listIssues({ q: 'tests' }, hitMeta);
  assert.equal(cacheStatus(hitMeta), 'HIT');
});

test('clearCache removes every entry', async () => {
  const provider = makeProvider();
  const cached = withCache(provider);

  await cached.listIssues({ q: 'tests' });
  cached.clearCache();
  await cached.listIssues({ q: 'tests' });

  assert.equal(provider.calls.listIssues, 2);
});

test('the wrapped provider keeps the original name and TTL', () => {
  const provider = makeProvider();
  const cached = withCache(provider, { ttlMs: 1234 });

  assert.equal(cached.name, 'fake');
  assert.equal(cached.ttlMs, 1234);
  assert.equal(typeof cached.listIssues, 'function');
  assert.equal(typeof cached.getRepoHealth, 'function');
  assert.equal(typeof cached.getRepoFile, 'function');
});
