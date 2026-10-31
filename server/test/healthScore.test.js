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

test('computeHealthScore clamps slow responses and stale repos to 0', () => {
  const score = computeHealthScore({
    lastMergedPrDays: 400,
    responseHours: 700,
    mergedPrs30d: 0,
    hasContributing: false,
  });
  assert.equal(score, 0);
});

test('computeHealthScore caps activity at 20 points', () => {
  const score = computeHealthScore({
    lastMergedPrDays: 2,
    responseHours: 4,
    mergedPrs30d: 85,
    hasContributing: true,
  });
  assert.equal(score, 96);
});

test('computeHealthScore omits the guide points when CONTRIBUTING is missing', () => {
  const score = computeHealthScore({
    lastMergedPrDays: 10,
    responseHours: 20,
    mergedPrs30d: 5,
    hasContributing: false,
  });
  assert.equal(score, 55);
});

test('computeHealthScore always stays between 0 and 100', () => {
  const samples = [
    { lastMergedPrDays: 0, responseHours: 0, mergedPrs30d: 0, hasContributing: false },
    { lastMergedPrDays: 1000, responseHours: 5000, mergedPrs30d: 1000, hasContributing: true },
    { lastMergedPrDays: 30, responseHours: 48, mergedPrs30d: 3, hasContributing: false },
  ];
  for (const sample of samples) {
    const score = computeHealthScore(sample);
    assert.ok(score >= 0 && score <= 100, `score ${score} is outside 0-100`);
  }
});
