import { getSession } from './session.js';

// Returns the signed-in GitHub login, or 'anonymous' if not signed in.
export function getCurrentUserId(req) {
  const session = getSession(req);
  return session?.userId || 'anonymous';
}
