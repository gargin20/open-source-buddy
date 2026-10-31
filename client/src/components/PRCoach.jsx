import { useState } from 'react';
import { checkPRDescription } from '../utils/checkPRDescription.js';

export default function PRCoach() {
  const [description, setDescription] = useState('');
  const checks = checkPRDescription(description);
  const passed = checks.filter((check) => check.passed).length;

  return (
    <main className="pr-coach">
      <header className="pr-coach-header">
        <h2>PR Coach</h2>
        <p>Paste your pull request description for a quick, private checklist review.</p>
        <p className="pr-coach-privacy">Your description is checked in your browser and is not sent to an AI service.</p>
      </header>

      <div className="pr-coach-layout">
        <section className="pr-coach-editor" aria-labelledby="pr-description-label">
          <label id="pr-description-label" htmlFor="pr-description">
            Pull request description
          </label>
          <textarea
            id="pr-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={'## What does this PR do?\n\nDescribe the changes and why they are needed.\n\n## How did you test it?\n\nList commands or checks you ran.\n\nCloses #123'}
            rows={16}
            spellCheck="true"
          />
          <p className="pr-coach-count" aria-live="polite">
            {description.trim() ? `${description.trim().split(/\s+/).length} words` : 'No description entered yet'}
          </p>
        </section>

        <section className="pr-coach-results" aria-labelledby="pr-checklist-heading">
          <div className="pr-coach-results-header">
            <h3 id="pr-checklist-heading">Description checklist</h3>
            <p className="pr-coach-score" aria-live="polite">
              {passed} of {checks.length} checks passed
            </p>
          </div>
          {!description.trim() && (
            <p className="pr-coach-empty" role="status">
              Paste a description to see which items are ready and how to improve the rest.
            </p>
          )}
          <ul className="pr-coach-checks">
            {checks.map((check) => (
              <li className={`pr-coach-check ${check.passed ? 'is-passed' : 'needs-work'}`} key={check.id}>
                <div className="pr-coach-check-heading">
                  <span className="pr-coach-state" aria-label={check.passed ? 'Passed' : 'Needs work'}>
                    {check.passed ? 'PASS' : 'NEEDS WORK'}
                  </span>
                  <strong>{check.label}</strong>
                </div>
                <p>{check.passed ? check.success : check.tip}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
