export function formatAge(createdAt) {
  const created = new Date(createdAt).getTime() / 1000;
  const days = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'today';
  return days === 1 ? '1 day ago' : `${days.toLocaleString()} days ago`;
}
