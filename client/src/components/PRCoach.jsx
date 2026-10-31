import { useMemo, useState } from 'react';
import { analyzePullRequest, EXAMPLE_DESCRIPTION } from '../utils/prCoach.js';

export default function PRCoach() {
  const [text, setText] = useState('');
  const analysis = useMemo(() => analyzePullRequest(text), [text]);

  return (
    <main className="coach">
      <section className="coach-intro">
        <h2>PR Coach</h2>
        <p>Paste your pull request description and review it before you submit.</p>
      </section>

      <div className="coach-grid">
        <section className="coach-editor" aria-label="Pull request description">
          <label htmlFor="pr-description">Pull request description</label>
          <textarea
            id="pr-description"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={18}
            placeholder={'Paste the description you plan to use, including "Closes #N".'}
          />
          <div className="coach-editor-footer">
            <span>{analysis.length.toLocaleString()} characters</span>
            <div className="coach-actions">
              <button className="btn" type="button" onClick={() => setText(EXAMPLE_DESCRIPTION)}>
                Try an example
              </button>
              <button className="btn" type="button" onClick={() => setText('')} disabled={!text}>
                Clear
              </button>
            </div>
          </div>
        </section>

        <section className="coach-results" aria-label="Checklist results">
          <div className="coach-summary" aria-live="polite">
            <h3>Checklist</h3>
            <span className={analysis.complete ? 'complete' : undefined}>
              {analysis.empty
                ? 'Waiting for a description'
                : `${analysis.passed} of ${analysis.total} checks pass`}
            </span>
          </div>

          <ul className="coach-checklist">
            {analysis.checks.map((check) => {
              const state = analysis.empty ? 'pending' : check.passed ? 'pass' : 'fail';
              return (
                <li key={check.id} className={`coach-check ${state}`}>
                  <span className="coach-status" aria-hidden="true">
                    {state === 'pending' ? '\u25cb' : state === 'pass' ? '\u2713' : '\u2717'}
                  </span>
                  <div>
                    <p className="coach-label">{check.label}</p>
                    <p className="coach-state">
                      {state === 'pending' ? 'Pending' : state === 'pass' ? 'Pass' : 'Fail'}
                    </p>
                    {state === 'fail' && <p className="coach-tip">{check.tip}</p>}
                  </div>
                </li>
              );
            })}
          </ul>

          {analysis.complete && (
            <p className="coach-done">Ready to submit. The description covers every check.</p>
          )}
        </section>
      </div>
    </main>
  );
}
