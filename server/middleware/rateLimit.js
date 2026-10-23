// TODO: limit each client (by IP) to a sensible number of requests per minute
// and answer with HTTP 429 and a Retry-After header when the limit is exceeded.
// Do not add a dependency unless you need one; a small in-memory Map works.
export function rateLimit(req, res, next) {
  next();
}
