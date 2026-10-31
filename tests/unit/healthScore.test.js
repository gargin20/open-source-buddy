import test from 'node:test';
import assert from 'node:assert/strict';
import { computeHealthScore } from '../../server/lib/healthScore.js';

test('computeHealthScore gives the maximum score at the metric caps', () => {
  assert.equal(
    computeHealthScore({
      lastMergedPrDays: 0,
      responseHours: 0,
      mergedPrs30d: 20,
      hasContributing: true,
    }),
    100,
  );
});

test('computeHealthScore applies the recency, response, and activity weights', () => {
  assert.equal(
    computeHealthScore({
      lastMergedPrDays: 3,
      responseHours: 6,
      mergedPrs30d: 22,
      hasContributing: true,
    }),
    94,
  );
});

test('computeHealthScore clamps every metric contribution to its documented range', () => {
  assert.equal(
    computeHealthScore({
      lastMergedPrDays: -10,
      responseHours: -10,
      mergedPrs30d: 100,
      hasContributing: true,
    }),
    100,
  );
  assert.equal(
    computeHealthScore({
      lastMergedPrDays: 100,
      responseHours: 100,
      mergedPrs30d: -1,
      hasContributing: false,
    }),
    0,
  );
});

test('computeHealthScore treats non-finite metric values as zero contribution', () => {
  assert.equal(
    computeHealthScore({
      lastMergedPrDays: Number.NaN,
      responseHours: Number.POSITIVE_INFINITY,
      mergedPrs30d: Number.NaN,
      hasContributing: false,
    }),
    0,
  );
});
