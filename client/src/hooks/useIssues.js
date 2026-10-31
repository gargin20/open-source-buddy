import { useCallback, useEffect, useState } from 'react';
import { getIssues } from '../api.js';

const EMPTY = { items: [], total: 0, page: 1, perPage: 6, totalPages: 1 };

export function useIssues(params) {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const key = JSON.stringify(params);

  const retry = useCallback(() => {
    setRetryKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getIssues(params)
      .then((result) => {
        if (cancelled) return;
        setData(result);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Failed to load issues');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, retryKey]);

  return { data, loading, error, retry };
}
