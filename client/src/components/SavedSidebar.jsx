export default function SavedSidebar({ saved, onRemove }) {
  return (
    <aside className="sidebar" aria-label="Saved issues">
      <div className="sidebar-head">
        <h2>Saved ({saved.length})</h2>
        {/* TODO: clear all saved issues (ask for confirmation first). */}
        <button className="btn" onClick={() => {}}>
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
