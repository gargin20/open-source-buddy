import test from 'node:test';
import assert from 'node:assert/strict';
import { filterByLanguage, filterByQuery, filterByTopic } from './filters.js';

const issues = [
  { language: 'JavaScript', title: 'README update', body: 'Documentation', repo: 'org/docs', labels: ['help wanted'], topics: ['web'] },
  { language: 'TypeScript', title: 'Fix tests', body: 'Improve coverage', repo: 'org/app', labels: ['bug'], topics: ['testing'] },
];

test('language filter ignores capitalization and surrounding whitespace', () => {
  for (const language of ['javascript', 'JavaScript', 'JAVASCRIPT', ' JavaScript ']) {
    assert.deepEqual(filterByLanguage(issues, language), [issues[0]]);
  }
});

test('empty language filter returns every issue', () => {
  assert.equal(filterByLanguage(issues, '').length, issues.length);
  assert.equal(filterByLanguage(issues, '   ').length, issues.length);
  assert.equal(filterByLanguage(issues, undefined).length, issues.length);
});

test('query and topic filters retain their existing behavior', () => {
  assert.deepEqual(filterByQuery(issues, ' README '), [issues[0]]);
  assert.deepEqual(filterByTopic(issues, 'WEB'), [issues[0]]);
});
