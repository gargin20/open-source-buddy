import test from 'node:test';
import assert from 'node:assert/strict';
import { formatAge } from '../src/utils/formatAge.js';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 0, 15, 12, 0, 0);

function daysAgo(days) {
  return new Date(NOW - days * DAY).toISOString();
}

test('formatAge returns today for an issue created earlier today', (t) => {
  t.mock.method(Date, 'now', () => NOW);
  assert.equal(formatAge(daysAgo(0)), 'today');
  assert.equal(formatAge(new Date(NOW - 60 * 60 * 1000).toISOString()), 'today');
});

test('formatAge returns today for a future date', (t) => {
  t.mock.method(Date, 'now', () => NOW);
  assert.equal(formatAge(daysAgo(-2)), 'today');
});

test('formatAge returns 1 day ago for yesterday', (t) => {
  t.mock.method(Date, 'now', () => NOW);
  assert.equal(formatAge(daysAgo(1)), '1 day ago');
});

test('formatAge returns a sensible age in days instead of thousands of days', (t) => {
  t.mock.method(Date, 'now', () => NOW);
  assert.equal(formatAge(daysAgo(3)), '3 days ago');
  assert.equal(formatAge(daysAgo(30)), '30 days ago');
});

test('formatAge handles a Date object as well as an ISO string', (t) => {
  t.mock.method(Date, 'now', () => NOW);
  assert.equal(formatAge(new Date(NOW - 2 * DAY)), '2 days ago');
});
