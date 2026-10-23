import { useState } from 'react';
import { explainIssue } from '../api.js';

// TODO: stream the explanation instead of waiting for the whole answer, so the
// text appears while it is being written. The server side lives in
// server/routes/explainStream.js.
export function useExplain() {
  const [state, setState] = useState({ result: null, loading: false, error: null });

  async function explain(issue) {
    setState({ result: null, loading: true, error: null });
    try {
      const result = await explainIssue(issue);
      setState({ result, loading: false, error: null });
    } catch (err) {
      setState({ result: null, loading: false, error: err.message });
    }
  }

  const reset = () => setState({ result: null, loading: false, error: null });

  return { ...state, explain, reset };
}
