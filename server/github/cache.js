// TODO: cache GitHub responses so repeated requests do not burn the rate limit.
// Return a provider (same interface as provider.js) that remembers results of
// listIssues / getRepoHealth / getRepoFile for a few minutes.
export function withCache(provider) {
  return provider;
}
