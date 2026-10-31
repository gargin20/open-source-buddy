// In-memory rate limiter — no external dependency needed.
// Uses a fixed sliding window per client IP.

const WINDOW_MS = 60 * 1_000; // 1 minute

function createRateLimiter({ max, windowMs = WINDOW_MS }) {
  // Map<ip, { count: number, windowStart: number }>
  const store = new Map();

  // Periodically remove stale entries to prevent unbounded memory growth
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of store) {
      if (now - entry.windowStart > windowMs) store.delete(ip);
    }
  }, 5 * 60 * 1_000).unref(); // unref so the timer never blocks process exit

  return function rateLimiter(req, res, next) {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = store.get(ip);

    // Start a fresh window if none exists or the previous one has expired
    if (!entry || now - entry.windowStart > windowMs) {
      store.set(ip, { count: 1, windowStart: now });
      return next();
    }

    if (entry.count >= max) {
      const retryAfter = Math.ceil((windowMs - (now - entry.windowStart)) / 1_000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: `Rate limit exceeded. Try again in ${retryAfter} second${retryAfter === 1 ? '' : 's'}.`,
      });
    }

    entry.count++;
    next();
  };
}

// General API — 60 requests per minute per IP
export const rateLimit = createRateLimiter({ max: 60 });

// /api/explain — stricter: 5 requests per minute per IP (AI calls are expensive)
export const explainRateLimit = createRateLimiter({ max: 5 });
