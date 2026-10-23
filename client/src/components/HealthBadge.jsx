import { useEffect, useState } from 'react';
import { getHealth } from '../api.js';

function level(score) {
  if (score >= 70) return 'good';
  if (score >= 40) return 'ok';
  return 'poor';
}

export default function HealthBadge({ repo }) {
  const [health, setHealth] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getHealth(repo)
      .then((h) => !cancelled && setHealth(h))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [repo]);

  if (failed) return <span className="health poor">Health unavailable</span>;
  if (!health) return <span className="health">Checking health…</span>;

  return (
    <span
      className={`health ${level(health.score)}`}
      title={`Last merged PR ${health.lastMergedPrDays} days ago · maintainers respond in about ${health.responseHours}h · ${health.mergedPrs30d} PRs merged in 30 days`}
    >
      Health {health.score}% · CONTRIBUTING {health.hasContributing ? '✓' : '✗'}
    </span>
  );
}
