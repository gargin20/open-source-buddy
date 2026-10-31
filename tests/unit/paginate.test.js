import test from 'node:test';
import assert from 'node:assert/strict';
import { paginate } from '../../server/lib/paginate.js';

const items = ['a', 'b', 'c', 'd', 'e'];

test('paginate returns the requested page without skipping the first item', () => {
  assert.deepEqual(paginate(items, 1, 2), {
    items: ['a', 'b'],
    total: 5,
    page: 1,
    perPage: 2,
    totalPages: 3,
  });
  assert.deepEqual(paginate(items, 2, 2).items, ['c', 'd']);
});

test('paginate clamps pages below one and above the last page', () => {
  assert.deepEqual(paginate(items, 0, 2).items, ['a', 'b']);
  assert.deepEqual(paginate(items, 99, 2).items, ['e']);
});

test('paginate handles empty input and non-finite page numbers', () => {
  assert.deepEqual(paginate([], Number.NaN, 2), {
    items: [],
    total: 0,
    page: 1,
    perPage: 2,
    totalPages: 1,
  });
});

test('paginate rejects invalid page sizes', () => {
  assert.throws(() => paginate(items, 1, 0), RangeError);
  assert.throws(() => paginate(items, 1, 1.5), RangeError);
});
