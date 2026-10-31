// TODO: PR Coach. A textarea where the user pastes a PR description, plus a
// checklist of simple checks (has "Closes #N", has a title, is long enough).


import React, { useState } from 'react';

export default function PRCoach() {
  const [description, setDescription] = useState('');

  // Validation Logic using Regex
  const hasReference = /(Closes|Fixes|Resolves)\s*#\d+/i.test(description);
  const hasWhat = /what/i.test(description);
  const hasWhy = /why/i.test(description);
  const hasTesting = /test|screenshot/i.test(description);
  const isGoodLength = description.length >= 30 && description.length <= 2000;
  
  // Handle empty state gracefully
  const isEmpty = description.trim() === '';

  // Reusable Checklist Item Component
  const CheckItem = ({ passed, title, tip }) => {
    let statusIcon = '⚪';
    let textColor = 'black';
    
    if (!isEmpty) {
      statusIcon = passed ? '✅' : '❌';
      textColor = passed ? 'green' : 'red';
    }

    return (
      <div style={{ marginBottom: '12px', padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }}>
        <div style={{ fontWeight: 'bold', color: textColor }}>
          {statusIcon} {title}
        </div>
        {!passed && !isEmpty && (
          <p style={{ margin: '4px 0 0 24px', fontSize: '14px', color: '#555' }}>
            💡 Tip: {tip}
          </p>
        )}
      </div>
    );
  };

  return (
    <main style={{ padding: '20px', maxWidth: '700px', margin: '0 auto' }}>
      <h2>PR Coach</h2>
      <p style={{ marginBottom: '16px' }}>Paste your draft PR description below to check if it meets the project guidelines.</p>
      
      <textarea
        style={{ 
          width: '100%', 
          minHeight: '180px', 
          padding: '12px', 
          marginBottom: '20px',
          border: '1px solid #ccc',
          borderRadius: '6px',
          fontFamily: 'monospace'
        }}
        placeholder="Closes #12&#10;&#10;What: I added a new button...&#10;Why: Because the old one was broken...&#10;Tested: I ran the app locally and verified the click..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      
      <div>
        <CheckItem 
          passed={hasReference} 
          title="Links an Issue" 
          tip="Add 'Closes #N' (where N is the issue number) to automatically link it." 
        />
        <CheckItem 
          passed={hasWhat && hasWhy} 
          title="Explains What and Why" 
          tip="Explicitly include the words 'What:' and 'Why:' so reviewers have context." 
        />
        <CheckItem 
          passed={hasTesting} 
          title="Includes Testing Details" 
          tip="Mention how you checked your work. Use the words 'tested' or 'screenshot'." 
        />
        <CheckItem 
          passed={isGoodLength} 
          title="Appropriate Length" 
          tip="Your description is either too brief (under 30 chars) or way too long. Keep it concise." 
        />
      </div>
    </main>
  );
}
