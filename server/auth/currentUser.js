import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';

const SESSION_COOKIE = 'osb_session';
const ANONYMOUS_COOKIE = 'osb_anonymous';
const OAUTH_STATE_COOKIE = 'osb_oauth_state';
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;
const sessions = new Map();

function cookieOptions(path = '/') {
  return `Path=${path}; HttpOnly; SameSite=Lax${config.authCookieSecure ? '; Secure' : ''}`;
}

function readCookie(req, name) {
  const cookies = req.headers.cookie || '';
  for (const pair of cookies.split(';')) {
    const separator = pair.indexOf('=');
    if (separator < 0 || pair.slice(0, separator).trim() !== name) continue;
    return pair.slice(separator + 1).trim();
  }
  return '';
}

function setCookie(res, name, value, maxAge, path = '/') {
  res.append(
    'Set-Cookie',
    `${name}=${value}; ${cookieOptions(path)}; Max-Age=${maxAge}`,
  );
}

function clearCookie(res, name, path = '/') {
  res.append(
    'Set-Cookie',
    `${name}=; ${cookieOptions(path)}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
  );
}

function getSession(req, res) {
  const sessionId = readCookie(req, SESSION_COOKIE);
  if (!sessionId) return { user: null, expired: false };

  const session = sessions.get(sessionId);
  if (!session || session.expiresAt <= Date.now()) {
    sessions.delete(sessionId);
    clearCookie(res, SESSION_COOKIE);
    return { user: null, expired: true };
  }
  return { user: session.user, expired: false };
}

export function getCurrentUser(req, res) {
  return getSession(req, res);
}

export function getCurrentUserId(req, res) {
  const { user } = getSession(req, res);
  if (user) return `github:${user.id}`;

  let anonymousId = readCookie(req, ANONYMOUS_COOKIE);
  if (!/^[\da-f-]{36}$/i.test(anonymousId)) {
    anonymousId = randomUUID();
    setCookie(res, ANONYMOUS_COOKIE, anonymousId, 365 * 24 * 60 * 60);
  }
  return `anonymous:${anonymousId}`;
}

export function createSession(user, res) {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(id);
  }

  const sessionId = randomBytes(32).toString('base64url');
  sessions.set(sessionId, {
    user,
    expiresAt: now + SESSION_MAX_AGE_SECONDS * 1000,
  });
  setCookie(res, SESSION_COOKIE, sessionId, SESSION_MAX_AGE_SECONDS);
}

export function destroySession(req, res) {
  const sessionId = readCookie(req, SESSION_COOKIE);
  if (sessionId) sessions.delete(sessionId);
  clearCookie(res, SESSION_COOKIE);
}

export function createOAuthState(res) {
  const state = randomBytes(32).toString('base64url');
  setCookie(res, OAUTH_STATE_COOKIE, state, OAUTH_STATE_MAX_AGE_SECONDS, '/api/auth');
  return state;
}

export function consumeOAuthState(req, res, receivedState) {
  const expectedState = readCookie(req, OAUTH_STATE_COOKIE);
  clearCookie(res, OAUTH_STATE_COOKIE, '/api/auth');
  if (!expectedState || typeof receivedState !== 'string') return false;

  const expected = Buffer.from(expectedState);
  const received = Buffer.from(receivedState);
  return expected.length === received.length && timingSafeEqual(expected, received);
}
