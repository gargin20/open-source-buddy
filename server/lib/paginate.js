export function paginate(items, page, perPage) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = Math.max(0, (current - 1) * perPage - 1);
  const end = start + perPage;
  return {
    items: items.slice(start, end),
    total: items.length,
    page: current,
    perPage,
    totalPages,
  };
}
