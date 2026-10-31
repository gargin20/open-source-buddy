import { useCallback, useEffect, useState } from 'react';
import { getSaved, saveIssue, unsaveIssue } from '../api.js';

export function useSaved() {
  const [saved, setSaved] = useState([]);

  const refresh = useCallback(() => {
    return getSaved()
      .then((res) => setSaved(Array.isArray(res) ? res : (res?.items || [])))
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

  return { saved, save, remove };
}
