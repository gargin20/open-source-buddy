const ipMap = new Map();
const explainMap = new Map();

function checkLimit(map, ip, max, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  const history = (map.get(ip) || []).filter((t) => t > windowStart);

  if (history.length >= max) {
    const oldest = history[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return { limited: true, retryAfter: Math.max(1, retryAfter) };
  }

  history.push(now);
  map.set(ip, history);
  return { limited: false };
}

export function rateLimit(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const isExplain = req.path.startsWith('/explain');
  const max = isExplain ? 5 : 60;
  const map = isExplain ? explainMap : ipMap;

  const result = checkLimit(map, ip, max);
  if (result.limited) {
    res.set('Retry-After', String(result.retryAfter));
    return res.status(429).json({
      error: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
    });
  }

  next();
}
