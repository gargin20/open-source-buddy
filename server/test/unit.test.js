import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { filterByLanguage, filterByTopic } from '../lib/filters.js';
import { paginate } from '../lib/paginate.js';
import { computeHealthScore } from '../lib/healthScore.js';

describe('Filters', () => {
  it('filters by language case-insensitively', () => {
    const issues = [{ language: 'JavaScript' }, { language: 'Python' }];
    assert.equal(filterByLanguage(issues, 'javascript').length, 1);
    assert.equal(filterByLanguage(issues, 'PYTHON').length, 1);
  });
});

describe('Pagination', () => {
  it('paginates without repeating elements across pages', () => {
    const items = Array.from({ length: 20 }, (_, i) => i);
    const p1 = paginate(items, 1, 10);
    const p2 = paginate(items, 2, 10);
    assert.equal(p1.items.length, 10);
    assert.equal(p2.items.length, 10);
    assert.notEqual(p1.items[9], p2.items[0]);
  });
});

describe('Health Score', () => {
  it('clamps total and individual scores to documented ranges', () => {
    const high = computeHealthScore({ lastMergedPrDays: 0, responseHours: 0, mergedPrs30d: 50, hasContributing: true });
    assert.ok(high <= 100);

    const low = computeHealthScore({ lastMergedPrDays: 100, responseHours: 200, mergedPrs30d: -5, hasContributing: false });
    assert.ok(low >= 0);
  });
});
