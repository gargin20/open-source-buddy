import { config } from '../config.js';

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

export function createRateLimiter({
  windowMs = 60 * 1000,
  max = 60,
  message = 'Too many requests. Please try again later.',
  cleanupIntervalMs = 60 * 1000,
} = {}) {
  const store = new Map();

  // Periodically purge entries whose window has passed
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now >= entry.resetAt) {
        store.delete(key);
      }
    }
  }, cleanupIntervalMs);
  cleanupTimer.unref();

  function middleware(req, res, next) {
    const ip = getClientIp(req);
    const now = Date.now();

    // High-watermark memory protection: clean up expired entries if store gets large
    if (store.size > 2000) {
      for (const [key, entry] of store.entries()) {
        if (now >= entry.resetAt) {
          store.delete(key);
        }
      }
    }

    let entry = store.get(ip);
    if (!entry || now >= entry.resetAt) {
      entry = {
        count: 1,
        resetAt: now + windowMs,
      };
      store.set(ip, entry);
    } else {
      entry.count += 1;
    }

    const resetSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    const remaining = Math.max(0, max - entry.count);

    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(remaining));
    res.set('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
      res.set('Retry-After', String(resetSeconds));
      const errorMessage =
        typeof message === 'function'
          ? message(resetSeconds)
          : `${message} Please try again in ${resetSeconds} seconds.`;

      return res.status(429).json({
        error: errorMessage,
        retryAfter: resetSeconds,
      });
    }

    next();
  }

  middleware.reset = () => store.clear();
  middleware.getStore = () => store;

  return middleware;
}

// General API rate limiter: sensible per-minute limit (defaults to 100 req/min)
export const rateLimit = createRateLimiter({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: 'Too many requests from this IP.',
});

// Stricter rate limiter for /api/explain (defaults to 10 req/min)
export const explainRateLimit = createRateLimiter({
  windowMs: config.explainRateLimitWindowMs,
  max: config.explainRateLimitMax,
  message: 'Too many explain requests from this IP.',
});
