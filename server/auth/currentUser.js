// Returns a stable string key for the current request.
// When the user is signed in via GitHub OAuth the GitHub numeric user id is
// used; until then the session id acts as an anonymous bucket so every browser
// tab still gets its own saved-issue list rather than sharing one global one.
export function getCurrentUserId(req) {
  if (req.session?.githubUser?.id) {
    return String(req.session.githubUser.id);
  }
  // Fall back to the session id so anonymous users are still isolated.
  return req.session?.id ? `anon:${req.session.id}` : 'anonymous';
}
