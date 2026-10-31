import test from 'node:test';
import assert from 'node:assert/strict';
import { computeHealthScore } from '../lib/healthScore.js';

test('computeHealthScore gives 100 for the best possible metrics', () => {
  const score = computeHealthScore({
    lastMergedPrDays: 0,
    responseHours: 0,
    mergedPrs30d: 20,
    hasContributing: true,
  });
  assert.equal(score, 100);
});

test('computeHealthScore adds the four components for normal metrics', () => {
  const score = computeHealthScore({
    lastMergedPrDays: 3,
    responseHours: 6,
    mergedPrs30d: 10,
    hasContributing: true,
  });
  assert.equal(score, 84);
});

test('very slow responses cannot make responsiveness negative', () => {
  const score = computeHealthScore({
    lastMergedPrDays: 40,
    responseHours: 700,
    mergedPrs30d: 0,
    hasContributing: false,
  });
  assert.equal(score, 0);
});

test('large numbers of merged PRs cannot add more than 20 activity points', () => {
  const score = computeHealthScore({
    lastMergedPrDays: 40,
    responseHours: 60,
    mergedPrs30d: 85,
    hasContributing: false,
  });
  assert.equal(score, 20);
});

test('recency stays within 0 and 40 points', () => {
  assert.equal(
    computeHealthScore({
      lastMergedPrDays: 400,
      responseHours: 60,
      mergedPrs30d: 0,
      hasContributing: false,
    }),
    0,
  );
  assert.equal(
    computeHealthScore({
      lastMergedPrDays: -10,
      responseHours: 60,
      mergedPrs30d: 0,
      hasContributing: false,
    }),
    40,
  );
});

test('responsiveness stays within 0 and 30 points', () => {
  assert.equal(
    computeHealthScore({
      lastMergedPrDays: 40,
      responseHours: 0,
      mergedPrs30d: 0,
      hasContributing: false,
    }),
    30,
  );
  assert.equal(
    computeHealthScore({
      lastMergedPrDays: 40,
      responseHours: -10,
      mergedPrs30d: 0,
      hasContributing: false,
    }),
    30,
  );
});

test('activity stays within 0 and 20 points', () => {
  assert.equal(
    computeHealthScore({
      lastMergedPrDays: 40,
      responseHours: 60,
      mergedPrs30d: -5,
      hasContributing: false,
    }),
    0,
  );
  assert.equal(
    computeHealthScore({
      lastMergedPrDays: 40,
      responseHours: 60,
      mergedPrs30d: 100,
      hasContributing: false,
    }),
    20,
  );
});

test('the total score always stays between 0 and 100', () => {
  const samples = [
    { lastMergedPrDays: 0, responseHours: 0, mergedPrs30d: 0, hasContributing: false },
    { lastMergedPrDays: 1000, responseHours: 5000, mergedPrs30d: 1000, hasContributing: true },
    { lastMergedPrDays: 30, responseHours: 48, mergedPrs30d: 3, hasContributing: false },
    { lastMergedPrDays: -50, responseHours: -20, mergedPrs30d: 500, hasContributing: true },
  ];

  for (const sample of samples) {
    const score = computeHealthScore(sample);
    assert.ok(score >= 0 && score <= 100, `score ${score} is outside 0-100`);
  }
});
