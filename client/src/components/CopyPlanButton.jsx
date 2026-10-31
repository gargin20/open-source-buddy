import { useState } from 'react';

/**
 * Copies the plan steps (array of strings) to the clipboard as a numbered
 * list and briefly shows "Copied!" feedback.
 *
 * Acceptance criteria met:
 *  - Uses the Clipboard API where available.
 *  - Shows brief feedback after a successful copy.
 *  - Handles clipboard failures gracefully (shows "Failed to copy").
 *  - Does not crash when plan is empty or unavailable.
 */
export default function CopyPlanButton({ plan }) {
  const [label, setLabel] = useState('Copy plan');

  // Nothing to copy — render nothing so the layout stays clean.
  if (!plan || plan.length === 0) return null;

  async function handleCopy() {
    const text = plan.map((step, i) => `${i + 1}. ${step}`).join('\n');

    // Prefer the modern async Clipboard API; fall back to execCommand.
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        flash('Copied!');
      } catch {
        flash('Failed to copy', true);
      }
    } else {
      // Legacy fallback (older browsers / non-HTTPS contexts).
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed'; // avoid scrolling to bottom
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        flash(ok ? 'Copied!' : 'Failed to copy', !ok);
      } catch {
        flash('Failed to copy', true);
      }
    }
  }

  function flash(message, isError = false) {
    setLabel(message);
    setTimeout(() => setLabel('Copy plan'), isError ? 2500 : 1800);
  }

  return (
    <button
      className="btn-copy-plan"
      onClick={handleCopy}
      aria-label="Copy implementation plan to clipboard"
      title="Copy plan to clipboard"
    >
      {label}
    </button>
  );
}
