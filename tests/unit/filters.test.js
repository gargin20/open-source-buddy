import test from 'node:test';
import assert from 'node:assert/strict';
import { filterByLanguage, filterByQuery, filterByTopic } from '../../server/lib/filters.js';

const issues = [
  {
    title: 'Add a Search Feature',
    body: 'Search open issues',
    repo: 'sample-org/project',
    labels: ['good first issue', 'enhancement'],
    language: 'JavaScript',
    topics: ['web', 'tools'],
  },
  {
    title: 'Fix parser',
    body: 'Handle empty input',
    repo: 'sample-org/compiler',
    labels: ['bug'],
    language: 'TypeScript',
    topics: ['education'],
  },
  { title: 'Issue with optional metadata' },
];

test('filterByQuery matches issue text and labels without case sensitivity', () => {
  assert.deepEqual(filterByQuery(issues, 'SEARCH'), [issues[0]]);
  assert.deepEqual(filterByQuery(issues, 'GOOD FIRST ISSUE'), [issues[0]]);
  assert.deepEqual(filterByQuery(issues, 'SAMPLE-ORG/COMPILER'), [issues[1]]);
});

test('filterByQuery returns the original list for an empty query and tolerates missing labels', () => {
  assert.equal(filterByQuery(issues, '  '), issues);
  assert.deepEqual(filterByQuery(issues, 'optional'), [issues[2]]);
});

test('filterByLanguage filters exact language names and leaves results unchanged when unset', () => {
  assert.deepEqual(filterByLanguage(issues, 'JavaScript'), [issues[0]]);
  assert.equal(filterByLanguage(issues, ''), issues);
});

test('filterByTopic matches topics without case sensitivity and tolerates missing topics', () => {
  assert.deepEqual(filterByTopic(issues, 'WEB'), [issues[0]]);
  assert.deepEqual(filterByTopic(issues, 'missing'), []);
  assert.equal(filterByTopic(issues, ''), issues);
});
