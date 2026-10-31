import { useCallback, useEffect, useState } from 'react';
import { getSaved, saveIssue, unsaveIssue, clearSavedIssues } from '../api.js';

export function useSaved() {
  const [saved, setSaved] = useState([]);

  const refresh = useCallback(() => {
    return getSaved()
      .then((res) => setSaved(res.items))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = async (issue) => {
    await saveIssue(issue);
    await refresh();
  };

  const remove = async (id) => {
    await unsaveIssue(id);
    await refresh();
  };

  const clearAll = async () => {
    await clearSavedIssues();
    setSaved([]);
  };

  return { saved, save, remove, clearAll };
}
