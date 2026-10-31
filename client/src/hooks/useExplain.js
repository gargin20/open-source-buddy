import { useRef, useState } from 'react';
import { streamExplanation } from '../api.js';

export function useExplain() {
  const [state, setState] = useState({ result: null, loading: false, error: null });
  const controllerRef = useRef(null);

  async function explain(issue) {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setState({
      result: { markdown: '', plan: [], provider: null },
      loading: true,
      error: null,
    });

    try {
      await streamExplanation(issue, {
        signal: controller.signal,
        onStart: (data) => {
          if (controllerRef.current !== controller) return;
          setState((prev) => ({
            ...prev,
            result: { ...prev.result, provider: data.provider },
          }));
        },
        onChunk: (text) => {
          if (controllerRef.current !== controller) return;
          setState((prev) => ({
            ...prev,
            result: { ...prev.result, markdown: prev.result.markdown + text },
          }));
        },
      });

      if (controllerRef.current === controller) {
        setState((prev) => ({ ...prev, loading: false }));
      }
    } catch (err) {
      if (controllerRef.current !== controller) return;
      if (err.name === 'AbortError') {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }
      setState({
        result: null,
        loading: false,
        error: err.message || 'Could not stream the explanation',
      });
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }

  function cancel() {
    const controller = controllerRef.current;
    if (!controller) return;
    controllerRef.current = null;
    controller.abort();
    setState((prev) => ({ ...prev, loading: false }));
  }

  const reset = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState({ result: null, loading: false, error: null });
  };

  return { ...state, explain, cancel, reset };
}
