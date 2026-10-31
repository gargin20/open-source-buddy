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

function parseEvent(raw) {
  const lines = raw.split('\n');
  let event = 'message';
  const data = [];

  for (const line of lines) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
  }

  if (!data.length) return null;
  try {
    return { event, data: JSON.parse(data.join('\n')) };
  } catch {
    return null;
  }
}

export async function streamExplanation(issue, { onChunk, onStart, signal } = {}) {
  const res = await fetch('/api/explain/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ issue }),
    signal,
  });

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

  if (!res.body) throw new Error('Streaming is not supported by this browser.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finished = false;

  while (!finished) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

    let index = buffer.indexOf('\n\n');
    while (index !== -1) {
      const event = parseEvent(buffer.slice(0, index));
      buffer = buffer.slice(index + 2);

      if (event?.event === 'start') {
        onStart?.(event.data);
      } else if (event?.event === 'chunk' && event.data.text) {
        onChunk?.(event.data.text);
      } else if (event?.event === 'error') {
        throw new Error(event.data.error || 'Could not generate the explanation');
      } else if (event?.event === 'done') {
        finished = true;
        break;
      }

      index = buffer.indexOf('\n\n');
    }
  }

  if (!finished) {
    const event = parseEvent(buffer);
    if (event?.event === 'error') {
      throw new Error(event.data.error || 'Could not generate the explanation');
    }
  }
}

export const getSaved = () => request('/api/saved');

export const saveIssue = (issue) =>
  request('/api/saved', { method: 'POST', body: JSON.stringify({ issue }) });

export const unsaveIssue = (id) => request(`/api/saved/${encodeURIComponent(id)}`, { method: 'DELETE' });
