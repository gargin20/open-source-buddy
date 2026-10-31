import HealthBadge from './HealthBadge.jsx';
import { formatAge } from '../utils/formatAge.js';

export default function IssueCard({ issue, active, saved, onSelect, onSave }) {
  return (
    <article className={active ? 'issue-card active' : 'issue-card'}>
      <h3>
        <button className="link" onClick={onSelect}>
          {issue.title}
        </button>
      </h3>
      <p className="repo">
        {issue.repo} · {issue.language}
      </p>
      <div className="labels">
        {issue.labels.map((label) => (
          <span key={label} className="label">
            {label}
          </span>
        ))}
      </div>
      <div className="meta">
        <span>{formatAge(issue.createdAt)}</span>
        <span>{issue.comments} comments</span>
      </div>
      <div className="card-footer">
        <HealthBadge repo={issue.repo} />
        <button className="btn" onClick={onSave} disabled={saved}>
          {saved ? '★ Saved' : '☆ Save'}
        </button>
      </div>
    </article>
  );
}
