// Turns raw repo metrics into a 0-100 "health" percentage.
//   recency        up to 40 points  (recently merged PR)
//   responsiveness up to 30 points  (fast maintainer replies)
//   guide          10 points        (CONTRIBUTING.md present)
//   activity       up to 20 points  (merged PRs in the last 30 days)
export function computeHealthScore({ lastMergedPrDays, responseHours, mergedPrs30d, hasContributing } = {}) {
  const safePrDays = Number(lastMergedPrDays ?? 40);
  const safeResponseHours = Number(responseHours ?? 60);
  const safeMergedPrs = Number(mergedPrs30d ?? 0);

  const recency = Math.min(40, Math.max(0, 40 - safePrDays));
  const responsiveness = Math.min(30, Math.max(0, 30 - safeResponseHours / 2));
  const guide = hasContributing ? 10 : 0;
  const activity = Math.min(20, Math.max(0, safeMergedPrs));

  const total = Math.round(recency + responsiveness + guide + activity);
  return Math.min(100, Math.max(0, total));
}
