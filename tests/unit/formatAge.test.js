import test from 'node:test';
import assert from 'node:assert/strict';
import { formatAge } from '../../client/src/utils/formatAge.js';

const now = Date.parse('2026-10-31T12:00:00.000Z');
const day = 24 * 60 * 60 * 1000;

test('formatAge returns today for dates less than one day old or in the future', (t) => {
  t.mock.method(Date, 'now', () => now);
  assert.equal(formatAge(new Date(now - day + 1).toISOString()), 'today');
  assert.equal(formatAge(new Date(now + day).toISOString()), 'today');
});

test('formatAge formats one day and multiple days ago', (t) => {
  t.mock.method(Date, 'now', () => now);
  assert.equal(formatAge(new Date(now - day).toISOString()), '1 day ago');
  assert.equal(formatAge(new Date(now - 3 * day).toISOString()), '3 days ago');
});

test('formatAge reports invalid dates as unknown', () => {
  assert.equal(formatAge('not-a-date'), 'unknown');
});
