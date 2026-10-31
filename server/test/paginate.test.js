import test from 'node:test';
import assert from 'node:assert/strict';
import { paginate } from '../lib/paginate.js';

const items = [1, 2, 3, 4, 5, 6, 7];

test('paginate returns the first page with correct metadata', () => {
  assert.deepEqual(paginate(items, 1, 3), {
    items: [1, 2, 3],
    total: 7,
    page: 1,
    perPage: 3,
    totalPages: 3,
  });
});

test('paginate starts page 2 at the next item instead of repeating the last one', () => {
  assert.deepEqual(paginate(items, 2, 3).items, [4, 5, 6]);
});

test('paginate returns the remaining items on the last page', () => {
  assert.deepEqual(paginate(items, 3, 3).items, [7]);
});

test('paginate shows every item exactly once across all pages', () => {
  const seen = [];
  for (let page = 1; page <= 3; page += 1) {
    seen.push(...paginate(items, page, 3).items);
  }
  assert.deepEqual(seen, items);
});

test('paginate clamps a page below the first page', () => {
  assert.deepEqual(paginate(items, 0, 3).items, [1, 2, 3]);
  assert.equal(paginate(items, -5, 3).page, 1);
});

test('paginate clamps a page above the last page', () => {
  const result = paginate(items, 99, 3);
  assert.equal(result.page, 3);
  assert.deepEqual(result.items, [7]);
});

test('paginate handles an empty list', () => {
  assert.deepEqual(paginate([], 1, 3), {
    items: [],
    total: 0,
    page: 1,
    perPage: 3,
    totalPages: 1,
  });
});

test('paginate does not mutate the input list', () => {
  const copy = [...items];
  paginate(items, 2, 3);
  assert.deepEqual(items, copy);
});
