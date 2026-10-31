import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {
  consumeOAuthState,
  createOAuthState,
  createSession,
  destroySession,
  getCurrentUser,
  getCurrentUserId,
} from '../auth/currentUser.js';
import { createAuthRouter } from '../routes/auth.js';

class FakeResponse {
  cookies = [];

  append(name, value) {
    assert.equal(name, 'Set-Cookie');
    this.cookies.push(value);
  }
}

function cookieValue(cookies, name) {
  const cookie = cookies.find((value) => value.startsWith(`${name}=`));
  return cookie?.match(new RegExp(`^${name}=([^;]*)`))?.[1] || '';
}

test('OAuth state is random, matched once from the browser cookie, and cleared', () => {
  const response = new FakeResponse();
  const state = createOAuthState(response);
  const cookie = cookieValue(response.cookies, 'osb_oauth_state');
  const request = { headers: { cookie: `osb_oauth_state=${cookie}` } };

  assert.ok(state);
  assert.equal(consumeOAuthState(request, response, state), true);
  assert.ok(response.cookies.at(-1).includes('Max-Age=0'));
  assert.equal(consumeOAuthState({ headers: { cookie: '' } }, new FakeResponse(), state), false);
  assert.equal(consumeOAuthState(request, new FakeResponse(), 'wrong-state'), false);
});

test('sessions identify the GitHub user and saved-store key without exposing a token', () => {
  const response = new FakeResponse();
  createSession({ id: '12345', login: 'contributor', name: 'Contributor' }, response);
  const sessionCookie = cookieValue(response.cookies, 'osb_session');
  const request = { headers: { cookie: `osb_session=${sessionCookie}` } };

  assert.ok(sessionCookie);
  assert.deepEqual(getCurrentUser(request, new FakeResponse()), {
    user: { id: '12345', login: 'contributor', name: 'Contributor' },
    expired: false,
  });
  assert.equal(getCurrentUserId(request, new FakeResponse()), 'github:12345');
  assert.equal(JSON.stringify(getCurrentUser(request, new FakeResponse())).includes('access_token'), false);

  destroySession(request, response);
  assert.equal(getCurrentUser(request, new FakeResponse()).user, null);
});

test('expired sessions are cleared and treated as signed out', (t) => {
  const now = 1_800_000_000_000;
  t.mock.method(Date, 'now', () => now);
  const response = new FakeResponse();
  createSession({ id: 'expired-user', login: 'expired' }, response);
  const sessionCookie = cookieValue(response.cookies, 'osb_session');
  t.mock.method(Date, 'now', () => now + 8 * 24 * 60 * 60 * 1000);

  const expiredResponse = new FakeResponse();
  const result = getCurrentUser(
    { headers: { cookie: `osb_session=${sessionCookie}` } },
    expiredResponse,
  );
  assert.deepEqual(result, { user: null, expired: true });
  assert.ok(expiredResponse.cookies[0].includes('Max-Age=0'));
});

test('anonymous users receive stable but browser-specific saved-store identities', () => {
  const firstResponse = new FakeResponse();
  const firstId = getCurrentUserId({ headers: { cookie: '' } }, firstResponse);
  const anonymousCookie = cookieValue(firstResponse.cookies, 'osb_anonymous');
  const nextRequestId = getCurrentUserId(
    { headers: { cookie: `osb_anonymous=${anonymousCookie}` } },
    new FakeResponse(),
  );
  const otherBrowserId = getCurrentUserId({ headers: { cookie: '' } }, new FakeResponse());

  assert.match(firstId, /^anonymous:[\da-f-]{36}$/i);
  assert.equal(nextRequestId, firstId);
  assert.notEqual(otherBrowserId, firstId);
});

test('GitHub OAuth callback creates a server session and returns no access token', async (t) => {
  const config = {
    githubOAuthClientId: 'test-client-id',
    githubOAuthClientSecret: 'server-only-secret',
    githubOAuthCallbackUrl: 'http://localhost:3001/api/auth/github/callback',
    appUrl: 'http://localhost:5173',
  };
  const app = express();
  app.use('/api/auth', createAuthRouter({
    config,
    fetchImpl: async (url, options) => {
      if (url === 'https://github.com/login/oauth/access_token') {
        assert.equal(options.method, 'POST');
        assert.equal(JSON.parse(options.body).client_secret, config.githubOAuthClientSecret);
        return Response.json({ access_token: 'private-access-token' });
      }

      assert.equal(url, 'https://api.github.com/user');
      assert.equal(options.headers.Authorization, 'Bearer private-access-token');
      return Response.json({ id: 987, login: 'octocat', name: 'The Octocat' });
    },
  }));
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/auth`;

  const start = await fetch(`${baseUrl}/github`, { redirect: 'manual' });
  assert.equal(start.status, 302);
  const authorizationUrl = new URL(start.headers.get('location'));
  assert.equal(authorizationUrl.searchParams.get('client_id'), config.githubOAuthClientId);
  assert.equal(authorizationUrl.searchParams.get('scope'), 'read:user');
  const state = authorizationUrl.searchParams.get('state');
  const stateCookieHeader = start.headers.get('set-cookie');
  const stateCookie = stateCookieHeader.match(/osb_oauth_state=([^;]+)/)[1];
  assert.match(stateCookieHeader, /HttpOnly/i);
  assert.match(stateCookieHeader, /SameSite=Lax/i);

  const callback = await fetch(
    `${baseUrl}/github/callback?code=one-time-code&state=${encodeURIComponent(state)}`,
    {
      headers: { Cookie: `osb_oauth_state=${stateCookie}` },
      redirect: 'manual',
    },
  );
  assert.equal(callback.status, 303);
  assert.equal(callback.headers.get('location'), 'http://localhost:5173/');
  const sessionCookie = callback.headers.get('set-cookie').match(/osb_session=([^;,]+)/)[1];

  const currentUser = await fetch(`${baseUrl}/me`, {
    headers: { Cookie: `osb_session=${sessionCookie}` },
  });
  const authData = await currentUser.json();
  assert.deepEqual(authData.user, { login: 'octocat', name: 'The Octocat' });
  assert.equal('id' in authData.user, false);
  assert.equal(authData.enabled, true);
  assert.equal(JSON.stringify(authData).includes('private-access-token'), false);

  const logout = await fetch(`${baseUrl}/logout`, {
    method: 'POST',
    headers: { Cookie: `osb_session=${sessionCookie}` },
  });
  assert.equal(logout.status, 204);
  assert.ok(logout.headers.get('set-cookie').includes('Max-Age=0'));

  const signedOut = await fetch(`${baseUrl}/me`);
  assert.equal((await signedOut.json()).user, null);
});

test('GitHub sign-in is unavailable when OAuth credentials are missing', async (t) => {
  const app = express();
  app.use('/api/auth', createAuthRouter({
    config: {
      githubOAuthClientId: '',
      githubOAuthClientSecret: '',
      githubOAuthCallbackUrl: 'http://localhost:3001/api/auth/github/callback',
      appUrl: 'http://localhost:5173',
    },
  }));
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await new Promise((resolve) => server.once('listening', resolve));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/github`);
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /not configured/i);
});
