export default function Pagination({ page, totalPages, onPage }) {
  return (
    <nav className="pagination" aria-label="Pagination">
      <button className="btn" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        ← Prev
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button className="btn" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
        Next →
      </button>
    </nav>
  );
}
