import { useCallback, useEffect, useState } from 'react';
import { getIssues } from '../api.js';

const EMPTY = { items: [], total: 0, page: 1, perPage: 6, totalPages: 1 };

export function useIssues(params) {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const key = JSON.stringify(params);
  const retry = useCallback(() => setRetryCount((count) => count + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getIssues(params)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Please check your connection and try again.');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, retryCount]);

  return { data, loading, error, retry };
}
