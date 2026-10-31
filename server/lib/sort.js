export function sortIssues(issues, sort) {
  const sortBy = {
    newest: { field: 'createdAt', direction: -1 },
    oldest: { field: 'createdAt', direction: 1 },
    updated: { field: 'updatedAt', direction: -1 },
  }[sort];

  if (!sortBy) return [...issues];

  return issues
    .map((issue, index) => {
      const timestamp = Date.parse(issue[sortBy.field]);
      return { issue, index, timestamp: Number.isNaN(timestamp) ? null : timestamp };
    })
    .sort((a, b) => {
      if (a.timestamp === null) return b.timestamp === null ? a.index - b.index : 1;
      if (b.timestamp === null) return -1;
      return sortBy.direction * (a.timestamp - b.timestamp) || a.index - b.index;
    })
    .map(({ issue }) => issue);
}
