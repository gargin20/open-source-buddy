export function sortIssues(issues, sort) {
  if (sort === 'newest') {
    return [...issues].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }
  if (sort === 'oldest') {
    return [...issues].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
  }
  if (sort === 'comments') {
    return [...issues].sort((a, b) => (b.comments || 0) - (a.comments || 0));
  }
  return [...issues];
}
