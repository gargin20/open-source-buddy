// TODO: stream the explanation instead of waiting for the whole answer, so the
// text appears while it is being written. The server side lives in
// server/routes/explainStream.js.
import { useState, useRef } from 'react';

export function useExplain() {
  const [state, setState] = useState({ result: null, loading: false, error: null });
  const abortControllerRef = useRef(null);

  async function explain(issue) {
   
    setState({ result: '', loading: true, error: null });
    
   
    abortControllerRef.current = new AbortController();

    try {
      
      const response = await fetch('/api/explain/stream', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue }),
        signal: abortControllerRef.current.signal 
      });

      if (!response.ok) throw new Error('Stream connection failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let currentText = '';

      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.replace('data: ', '').trim();
            
            if (data === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.text) {
                currentText += parsed.text;
          
                setState(prev => ({ ...prev, result: currentText }));
              }
            } catch (e) {
             
            }
          }
        }
      }
      
      setState(prev => ({ ...prev, loading: false }));

    } catch (err) {
      if (err.name === 'AbortError') {
        setState(prev => ({ ...prev, loading: false, error: 'Explanation cancelled by user.' }));
      } else {
        setState(prev => ({ ...prev, loading: false, error: err.message }));
      }
    }
  }

 
  const cancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const reset = () => setState({ result: null, loading: false, error: null });

  return { ...state, explain, cancel, reset };
}