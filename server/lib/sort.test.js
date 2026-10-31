import test from 'node:test';
import assert from 'node:assert/strict';
import { sortIssues } from './sort.js';

const issues = [
  { id: 'old', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-03T00:00:00Z' },
  { id: 'new', createdAt: '2024-01-03T00:00:00Z', updatedAt: '2024-01-02T00:00:00Z' },
  { id: 'missing' },
];

test('newest and oldest sort by creation time and leave missing dates last', () => {
  assert.deepEqual(sortIssues(issues, 'newest').map(({ id }) => id), ['new', 'old', 'missing']);
  assert.deepEqual(sortIssues(issues, 'oldest').map(({ id }) => id), ['old', 'new', 'missing']);
});

test('updated sorts by update time and leaves missing dates last', () => {
  assert.deepEqual(sortIssues(issues, 'updated').map(({ id }) => id), ['old', 'new', 'missing']);
});

test('default and unknown sorts preserve order in a new array', () => {
  for (const sort of ['', 'unknown']) {
    const result = sortIssues(issues, sort);
    assert.deepEqual(result, issues);
    assert.notEqual(result, issues);
  }
});
