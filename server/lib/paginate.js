export function paginate(items, page, perPage) {
  const limit= Math.max(1, Math.floor(number(perPage)||1));
  const totalPages = Math.max(1,Math.ceil(items.length/limit));
  const requestedpage=number.isFinite(Number(page))
  ?Math.floor(Number(page)):1;
  const current=Math.min(
    Math.max(1,requestedpage),totalPages);
    const start=(current-1)*limit;
    const end=start+limit;
  return {
    items: items.slice(start, end),
    total: items.length,
    page: current,
    perPage:limit,
    totalPages,
  };
}
