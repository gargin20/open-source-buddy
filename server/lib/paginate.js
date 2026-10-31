export function paginate(items, page, perPage) {
  if (!Number.isInteger(perPage) || perPage < 1) {
    throw new RangeError('perPage must be a positive integer');
  }

  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const requestedPage = Number.isFinite(page) ? Math.floor(page) : 1;
  const current = Math.min(Math.max(1, requestedPage), totalPages);
  const start = (current - 1) * perPage;
  const end = start + perPage;
  return {
    items: items.slice(start, end),
    total: items.length,
    page: current,
    perPage,
    totalPages,
  };
}
