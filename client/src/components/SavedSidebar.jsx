export default function SavedSidebar({ saved, onRemove, onClear }) {
  function handleClear() {
    if (!saved.length) return;
    if (window.confirm('Are you sure you want to clear all saved issues?')) {
      onClear?.();
    }
  }

  return (
    <aside className="sidebar" aria-label="Saved issues">
      <div className="sidebar-head">
        <h2>Saved ({saved.length})</h2>
        <button className="btn" onClick={handleClear} disabled={!saved.length}>
          Clear saved
        </button>
      </div>
      {saved.length === 0 && <p className="empty">Nothing saved yet. Press Save on an issue.</p>}
      <ul>
        {saved.map((issue) => (
          <li key={issue.id}>
            <span>
              {issue.title}
              <small>{issue.repo}</small>
            </span>
            <button className="btn" onClick={() => onRemove(issue.id)} aria-label={`Remove ${issue.title}`}>
              ✕
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
