export const ANONYMOUS_USER = Object.freeze({
  id: 'anonymous',
  login: 'anonymous',
  name: 'Anonymous',
  isAnonymous: true,
});

export function currentUser(req, _res, next) {
  const sessionUser = req.session?.user;

  if (sessionUser?.id) {
    req.user = { ...sessionUser, isAnonymous: false };
  } else {
    req.user = { ...ANONYMOUS_USER };
  }

  req.userId = req.user.id;
  next();
}

export function getCurrentUserId(req) {
  return req.userId || req.user?.id || 'anonymous';
}
