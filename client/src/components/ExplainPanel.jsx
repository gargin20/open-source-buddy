import Markdown from './Markdown.jsx';
import CopyPlanButton from './CopyPlanButton.jsx';

export default function ExplainPanel({ result, error, loading, cancel }) {
  if (error) {
    return (
      <div className="error" role="alert">
        {error}
      </div>
    );
  }
  
  if (!result && !loading) return null;

  // Handles both the new streaming text string and the old JSON object format
  const textToDisplay = typeof result === 'string' ? result : result?.markdown;
  const provider = result?.provider;
  const plan = result?.plan;

  return (
    <section className="explain" aria-label="AI explanation">
      <div className="explain-head">
        {provider && <span className="provider">AI provider: {provider}</span>}
        {plan && <CopyPlanButton plan={plan} />}
        
        {loading && (
          <button onClick={cancel} className="cancel-btn" style={{ marginLeft: 'auto', backgroundColor: '#ff4d4f', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
            Cancel
          </button>
        )}
      </div>
      <Markdown text={textToDisplay || 'Generating explanation...'} />
    </section>
  );
}