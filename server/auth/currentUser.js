// In-memory session store: token -> user profile
const sessions = new Map();

export function createSession(user) {
  const token = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  sessions.set(token, user);
  return token;
}

export function getSession(token) {
  return sessions.get(token);
}

export function removeSession(token) {
  sessions.delete(token);
}

export function getCurrentUser(req) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/session_token=([^;]+)/);
  const token = (match && match[1]) || req.headers['authorization']?.replace(/^Bearer\s+/i, '') || req.query?.token;
  if (token && sessions.has(token)) {
    return sessions.get(token);
  }
  return null;
}

export function getCurrentUserId(req) {
  const user = getCurrentUser(req);
  return user?.login || user?.id?.toString() || req.headers['x-user-id'] || 'anonymous';
}
