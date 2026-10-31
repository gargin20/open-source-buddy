import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSaved, saveIssue, unsaveIssue } from '../api.js';

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

  const savedIds = useMemo(() => new Set(saved.map((item) => String(item.id))), [saved]);
  const isSaved = (id) => savedIds.has(String(id));

  const save = async (issue) => {
    if (isSaved(issue.id)) return;
    await saveIssue(issue);
    await refresh();
  };

  const remove = async (id) => {
    await unsaveIssue(id);
    await refresh();
  };

  return { saved, save, remove, isSaved };
}
