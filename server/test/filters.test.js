import test from 'node:test';
import assert from 'node:assert/strict';
import { filterByQuery, filterByLanguage, filterByTopic } from '../lib/filters.js';

const issues = [
  {
    title: 'Search box loses focus after typing one letter',
    body: 'The SearchInput component probably re-mounts on each render.',
    repo: 'sample-org/pixel-notes',
    labels: ['good first issue', 'bug'],
    language: 'JavaScript',
    topics: ['web', 'notes'],
  },
  {
    title: 'CSV reader fails on files with a BOM',
    body: 'Files saved by Excel start with a byte order mark.',
    repo: 'sample-org/data-wrangler',
    labels: ['bug', 'good first issue'],
    language: 'Python',
    topics: ['data', 'cli'],
  },
];

test('filterByQuery returns every issue for an empty or blank query', () => {
  assert.equal(filterByQuery(issues, ''), issues);
  assert.equal(filterByQuery(issues, '   '), issues);
  assert.equal(filterByQuery(issues, undefined), issues);
});

test('filterByQuery matches the title and body case-insensitively', () => {
  assert.deepEqual(filterByQuery(issues, 'SEARCH BOX'), [issues[0]]);
  assert.deepEqual(filterByQuery(issues, 'byte order mark'), [issues[1]]);
});

test('filterByQuery matches the repository and labels', () => {
  assert.deepEqual(filterByQuery(issues, 'data-wrangler'), [issues[1]]);
  assert.deepEqual(filterByQuery(issues, 'good first issue'), issues);
});

test('filterByQuery returns no issues when nothing matches', () => {
  assert.deepEqual(filterByQuery(issues, 'does-not-exist'), []);
});

test('filterByLanguage returns every issue for an empty language', () => {
  assert.equal(filterByLanguage(issues, ''), issues);
  assert.equal(filterByLanguage(issues, '   '), issues);
  assert.equal(filterByLanguage(issues, undefined), issues);
});

test('filterByLanguage matches the exact language', () => {
  assert.deepEqual(filterByLanguage(issues, 'JavaScript'), [issues[0]]);
  assert.deepEqual(filterByLanguage(issues, 'Python'), [issues[1]]);
});

test('filterByLanguage ignores capitalization and surrounding spaces', () => {
  assert.deepEqual(filterByLanguage(issues, 'javascript'), [issues[0]]);
  assert.deepEqual(filterByLanguage(issues, ' JAVASCRIPT '), [issues[0]]);
  assert.deepEqual(filterByLanguage(issues, ' python '), [issues[1]]);
});

test('filterByLanguage returns no issues for an unknown language', () => {
  assert.deepEqual(filterByLanguage(issues, 'Rust'), []);
});

test('filterByTopic returns every issue for an empty topic', () => {
  assert.equal(filterByTopic(issues, ''), issues);
  assert.equal(filterByTopic(issues, undefined), issues);
});

test('filterByTopic matches a topic case-insensitively', () => {
  assert.deepEqual(filterByTopic(issues, 'web'), [issues[0]]);
  assert.deepEqual(filterByTopic(issues, 'CLI'), [issues[1]]);
});

test('filterByTopic returns no issues for an unknown topic', () => {
  assert.deepEqual(filterByTopic(issues, 'design'), []);
});
