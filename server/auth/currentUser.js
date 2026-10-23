// TODO: GitHub OAuth login. Once users can sign in, return the id of the
// signed-in user (for example from a session cookie) so saved issues are
// stored per user. Until then everyone shares one anonymous bucket.
export function getCurrentUserId(req) {
  return 'anonymous';
}
