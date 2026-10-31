export default function SavedSidebar({ saved, onRemove, onClearAll }) {
  const handleClearAll = () => {
    if (saved.length === 0) return;
    if (window.confirm('Remove all saved issues?')) {
      onClearAll();
    }
  };

  return (
    <aside className="sidebar" aria-label="Saved issues">
      <div className="sidebar-head">
        <h2>Saved ({saved.length})</h2>
        <button className="btn" onClick={handleClearAll} disabled={saved.length === 0}>
          Clear saved
        </button>
      </div>
      {saved.length === 0 && <p className="empty">Nothing saved yet. Press Save on an issue.</p>}
      <ul>
        {saved.map((issue, i) => (
          <li key={`${issue.id}-${i}`}>
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
