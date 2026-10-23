async function request(path, options = {}) {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      // response had no JSON body
    }
    throw new Error(message);
  }
  return res.json();
}

export const getStatus = () => request('/api/status');

export function getIssues(params) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value != null) qs.set(key, value);
  });
  return request(`/api/issues?${qs}`);
}

export const getHealth = (repo) => request(`/api/repos/${repo}/health`);

export const explainIssue = (issue) =>
  request('/api/explain', { method: 'POST', body: JSON.stringify({ issue }) });

export const getSaved = () => request('/api/saved');

export const saveIssue = (issue) =>
  request('/api/saved', { method: 'POST', body: JSON.stringify({ issue }) });

export const unsaveIssue = (id) => request(`/api/saved/${encodeURIComponent(id)}`, { method: 'DELETE' });
