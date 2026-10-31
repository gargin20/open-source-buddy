// Turns raw repo metrics into a 0-100 "health" percentage.
//   recency        up to 40 points  (recently merged PR)
//   responsiveness up to 30 points  (fast maintainer replies)
//   guide          10 points        (CONTRIBUTING.md present)
//   activity       up to 20 points  (merged PRs in the last 30 days)
export function computeHealthScore({ lastMergedPrDays, responseHours, mergedPrs30d, hasContributing }) {
  const recency = Math.min(40, Math.max(0, 40 - lastMergedPrDays));
  const responsiveness = Math.min(30, Math.max(0, 30 - responseHours / 2));
  const guide = hasContributing ? 10 : 0;
  const activity = Math.min(20, Math.max(0, mergedPrs30d));
  return Math.round(recency + responsiveness + guide + activity);
}
