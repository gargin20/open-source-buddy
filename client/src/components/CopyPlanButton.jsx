import { useEffect, useRef, useState } from 'react';

function getCopyText(plan, explanation) {
  if (Array.isArray(plan)) {
    const steps = plan.map((step) => String(step ?? '').trim()).filter(Boolean);
    if (steps.length) return steps.map((step, index) => `${index + 1}. ${step}`).join('\n');
  } else if (typeof plan === 'string' && plan.trim()) {
    return plan.trim();
  }

  return typeof explanation === 'string' ? explanation.trim() : '';
}

export default function CopyPlanButton({ plan, explanation }) {
  const [feedback, setFeedback] = useState('');
  const feedbackTimeout = useRef(null);
  const text = getCopyText(plan, explanation);

  useEffect(() => () => clearTimeout(feedbackTimeout.current), []);

  async function handleCopy() {
    if (!text) {
      setFeedback('Nothing to copy.');
      return;
    }

    if (!globalThis.navigator?.clipboard?.writeText) {
      setFeedback('Clipboard access is unavailable in this browser.');
      return;
    }

    try {
      await globalThis.navigator.clipboard.writeText(text);
      setFeedback('Copied!');
    } catch {
      setFeedback('Could not copy. Check clipboard permissions and try again.');
    }

    clearTimeout(feedbackTimeout.current);
    feedbackTimeout.current = setTimeout(() => setFeedback(''), 2000);
  }

  return (
    <span>
      <button className="btn" onClick={handleCopy} disabled={!text}>
        Copy plan
      </button>
      <span role="status" aria-live="polite">
        {feedback}
      </span>
    </span>
  );
}
