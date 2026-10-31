// Sort issues by the given option. Always returns a NEW array.
// Unknown or empty sort → original order is preserved.
export function sortIssues(issues, sort) {
  if (sort === 'newest') {
    return [...issues].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    );
  }
  if (sort === 'oldest') {
    return [...issues].sort(
      (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
    );
  }
  if (sort === 'updated') {
    // Fall back to createdAt when updatedAt is not available
    return [...issues].sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0),
    );
  }
  // Default: keep original order
  return issues;
}