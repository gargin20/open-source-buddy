// Turns raw repo metrics into a 0-100 "health" percentage.
//   recency        up to 40 points  (recently merged PR)
//   responsiveness up to 30 points  (fast maintainer replies)
//   guide          10 points        (CONTRIBUTING.md present)
//   activity       up to 20 points  (merged PRs in the last 30 days)
export function computeHealthScore({ lastMergedPrDays, responseHours, mergedPrs30d, hasContributing }) {
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const recency = Number.isFinite(lastMergedPrDays)
    ? clamp(40 - lastMergedPrDays, 0, 40)
    : 0;
  const responsiveness = Number.isFinite(responseHours)
    ? clamp(30 - responseHours / 2, 0, 30)
    : 0;
  const guide = hasContributing ? 10 : 0;
  const activity = Number.isFinite(mergedPrs30d) ? clamp(mergedPrs30d, 0, 20) : 0;
  return Math.round(recency + responsiveness + guide + activity);
}
