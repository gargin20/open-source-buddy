export function filterByQuery(issues, q) {
  const needle = String(q || '').trim().toLowerCase();
  if (!needle) return issues;
  return issues.filter((issue) =>
    [issue.title, issue.body, issue.repo, ...issue.labels]
      .join(' ')
      .toLowerCase()
      .includes(needle),
  );
}

export function filterByLanguage(issues, language) {
  const lang = String(language || '').trim().toLowerCase();
  if (!lang) return issues;
  return issues.filter((issue) => String(issue.language || '').trim().toLowerCase() === lang);
}

export function filterByTopic(issues, topic) {
  if (!topic) return issues;
  const wanted = String(topic).toLowerCase();
  return issues.filter((issue) => issue.topics.some((t) => t.toLowerCase() === wanted));
}
