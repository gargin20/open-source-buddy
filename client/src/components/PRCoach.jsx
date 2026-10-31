import { useState } from 'react';

export default function PRCoach() {
  const [text, setText] = useState('');

  const hasCloses = /closes\s+#[0-9]+/i.test(text);
  const hasWhat = /what|change|summary/i.test(text);
  const hasTesting = /test|verified|checked/i.test(text);
  const isGoodLength = text.trim().length >= 40 && text.trim().length <= 4000;

  const checks = [
    {
      label: 'Links an issue (e.g. Closes #12)',
      pass: hasCloses,
      tip: 'Include "Closes #<issue-number>" so GitHub links your PR to the issue.',
    },
    {
      label: 'Explains what was changed and why',
      pass: hasWhat,
      tip: 'Briefly explain the problem cause and what your code does.',
    },
    {
      label: 'Mentions how changes were tested',
      pass: hasTesting,
      tip: 'Explain how you tested the app in the browser or terminal.',
    },
    {
      label: 'Sufficient description length',
      pass: isGoodLength,
      tip: 'Keep the description concise and descriptive (at least 40 characters).',
    },
  ];

  return (
    <main className="pr-coach panel" style={{ maxWidth: '800px', margin: '20px auto', padding: '24px' }}>
      <h2>PR Coach</h2>
      <p className="muted">Paste your draft Pull Request description below to review its quality before submitting.</p>

      <textarea
        rows={8}
        style={{ width: '100%', padding: '12px', margin: '16px 0', fontFamily: 'inherit' }}
        placeholder="Paste your PR markdown description here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="checks" style={{ display: 'grid', gap: '12px' }}>
        {checks.map((c, i) => (
          <div key={i} style={{ padding: '10px 14px', borderRadius: '8px', background: c.pass ? '#e8f5e9' : '#fff3e0', border: `1px solid ${c.pass ? '#4caf50' : '#ffa726'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
              <span>{c.pass ? '✓' : '✗'}</span>
              <span>{c.label}</span>
            </div>
            {!c.pass && <p style={{ margin: '4px 0 0 24px', fontSize: '0.88rem', color: '#666' }}>{c.tip}</p>}
          </div>
        ))}
      </div>
    </main>
  );
}
