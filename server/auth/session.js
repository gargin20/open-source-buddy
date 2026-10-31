import crypto from 'node:crypto';
import { config } from '../config.js';

// In-memory session store: Map<sessionId, { userId, login, avatarUrl }>
// Sessions are lost on server restart — acceptable for this app.
const store = new Map();

const COOKIE_NAME = 'osb_sid';
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

function sign(id) {
  return crypto.createHmac('sha256', config.sessionSecret).update(id).digest('base64url');
}

function cookieValue(id) {
  return `${id}.${sign(id)}`;
}

function verifyAndParse(raw) {
  if (!raw) return null;
  const dot = raw.lastIndexOf('.');
  if (dot === -1) return null;
  const id = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = sign(id);
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  return id;
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k) cookies[k.trim()] = decodeURIComponent(v.join('='));
  }
  return cookies;
}

export function getSession(req) {
  const cookies = parseCookies(req.headers.cookie);
  const raw = cookies[COOKIE_NAME];
  const id = verifyAndParse(raw);
  if (!id) return null;
  return store.get(id) || null;
}

export function createSession(res, data) {
  const id = crypto.randomBytes(24).toString('base64url');
  store.set(id, data);
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${cookieValue(id)}; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}; Path=/`,
  );
  return id;
}

export function destroySession(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const raw = cookies[COOKIE_NAME];
  const id = verifyAndParse(raw);
  if (id) store.delete(id);
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`);
}
