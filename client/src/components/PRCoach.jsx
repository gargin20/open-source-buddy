import { useState } from 'react';

// ── Checklist rules ────────────────────────────────────────────────────────
// Each rule is: { id, label, tip, check(text) → boolean }

const MIN_LENGTH = 80;   // characters — too short below this
const MAX_LENGTH = 4000; // characters — excessively long above this

const RULES = [
  {
    id: 'closes',
    label: 'Has a "Closes #N" reference',
    tip: 'Add "Closes #N" (e.g. Closes #42) so GitHub links your PR to the issue and auto-closes it when merged.',
    check: (t) => /closes\s+#\d+/i.test(t),
  },
  {
    id: 'not-empty',
    label: 'Description is not empty',
    tip: 'Write at least a sentence explaining what this PR does.',
    check: (t) => t.trim().length > 0,
  },
  {
    id: 'min-length',
    label: `Description is long enough (≥ ${MIN_LENGTH} characters)`,
    tip: `Your description is too short. Aim for at least ${MIN_LENGTH} characters so reviewers understand the change.`,
    check: (t) => t.trim().length >= MIN_LENGTH,
  },
  {
    id: 'max-length',
    label: `Description is not excessively long (≤ ${MAX_LENGTH} characters)`,
    tip: `Your description is very long (> ${MAX_LENGTH} chars). Consider summarising — reviewers may skip walls of text.`,
    check: (t) => t.trim().length <= MAX_LENGTH,
  },
  {
    id: 'what',
    label: 'Explains WHAT was changed',
    tip: 'Include a "What I did" section (or similar) describing the actual code change.',
    check: (t) =>
      /what|change[ds]?|implement|add(ed)?|fix(ed)?|update[ds]?|refactor/i.test(t),
  },
  {
    id: 'why',
    label: 'Explains WHY the change was made',
    tip: 'Mention the motivation or the issue it solves — e.g. "This fixes…", "Because…", or "So that…".',
    check: (t) =>
      /why|because|so that|in order to|motivation|reason|fix(es)?|solves?|resolves?|closes?/i.test(t),
  },
  {
    id: 'testing',
    label: 'Describes how it was tested',
    tip: 'Add a "Testing" or "How to test" section. Even "Tested manually by…" is fine.',
    check: (t) =>
      /test(ed|ing|s)?|verified|checked|ran|manual|browser|npm run/i.test(t),
  },
  {
    id: 'one-issue',
    label: 'Targets a single issue (one Closes reference)',
    tip: 'Each PR should solve exactly one issue. If you have multiple Closes references, consider splitting the PR.',
    check: (t) => {
      const matches = t.match(/closes\s+#\d+/gi) || [];
      return matches.length === 1;
    },
  },
];

// ── Helper ─────────────────────────────────────────────────────────────────

function runChecks(text) {
  return RULES.map((rule) => ({
    ...rule,
    passed: text.trim().length === 0 ? null : rule.check(text), // null = not evaluated yet
  }));
}

// ── Component ──────────────────────────────────────────────────────────────

export default function PRCoach() {
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState({}); // which tips are open

  const results = runChecks(text);
  const evaluated = text.trim().length > 0;
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  function toggleTip(id) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <main className="pr-coach">
      <div className="pr-coach-header">
        <h2>PR Coach</h2>
        <p className="pr-coach-subtitle">
          Paste your pull request description below and get instant feedback.
        </p>
      </div>

      <textarea
        className="pr-coach-input"
        rows={10}
        placeholder={`Paste your PR description here…\n\nExample:\n  Closes #9\n\n  ## What I did\n  Implemented the CopyPlanButton…\n\n  ## Testing\n  Ran npm run dev and clicked the button.`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Pull request description"
        spellCheck
      />

      {/* Character counter */}
      <div className="pr-coach-meta">
        <span className={text.length > MAX_LENGTH ? 'pr-char-count over' : 'pr-char-count'}>
          {text.length} / {MAX_LENGTH} characters
        </span>
        {evaluated && (
          <span className="pr-score">
            {passed} / {total} checks passed
          </span>
        )}
      </div>

      {/* Progress bar */}
      {evaluated && (
        <div className="pr-progress-bar" aria-label={`${passed} of ${total} checks passed`}>
          <div
            className="pr-progress-fill"
            style={{ width: `${(passed / total) * 100}%` }}
          />
        </div>
      )}

      {/* Checklist */}
      <ul className="pr-checklist" aria-label="PR checklist">
        {results.map((result) => {
          const state =
            result.passed === null ? 'pending'
            : result.passed ? 'pass'
            : 'fail';

          return (
            <li key={result.id} className={`pr-check pr-check-${state}`}>
              <div className="pr-check-row">
                <span className="pr-check-icon" aria-hidden="true">
                  {state === 'pass' ? '✅' : state === 'fail' ? '❌' : '⬜'}
                </span>
                <span className="pr-check-label">{result.label}</span>
                {state === 'fail' && (
                  <button
                    className="pr-tip-toggle"
                    onClick={() => toggleTip(result.id)}
                    aria-expanded={!!expanded[result.id]}
                    aria-label={`Tip for: ${result.label}`}
                  >
                    {expanded[result.id] ? 'Hide tip ▲' : 'How to fix ▼'}
                  </button>
                )}
              </div>
              {state === 'fail' && expanded[result.id] && (
                <p className="pr-tip">{result.tip}</p>
              )}
            </li>
          );
        })}
      </ul>

      {/* Summary message */}
      {evaluated && (
        <div className={`pr-summary ${passed === total ? 'pr-summary-pass' : 'pr-summary-fail'}`}>
          {passed === total
            ? '🎉 All checks passed! Your PR description looks great.'
            : `⚠️ ${total - passed} check${total - passed > 1 ? 's' : ''} need${total - passed === 1 ? 's' : ''} attention. Expand "How to fix" for guidance.`}
        </div>
      )}
    </main>
  );
}
