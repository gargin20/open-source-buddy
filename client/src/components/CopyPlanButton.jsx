import { useState } from 'react';

export default function CopyPlanButton({ plan }) {
  const [copied, setCopied] = useState(false);

  if (!plan || (Array.isArray(plan) && plan.length === 0)) return null;

  async function handleCopy() {
    const text = Array.isArray(plan)
      ? plan.map((step, idx) => `${idx + 1}. ${step}`).join('\n')
      : String(plan);

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy plan:', err);
    }
  }

  return (
    <button className="btn secondary" onClick={handleCopy} disabled={!plan}>
      {copied ? 'Copied!' : 'Copy plan'}
    </button>
  );
}
