/**
 * GitHub OAuth routes
 *
 * GET  /auth/github           → redirect to GitHub authorization page
 * GET  /auth/github/callback  → GitHub redirects here after the user approves
 * GET  /auth/me               → return the signed-in user (or null)
 * POST /auth/logout           → clear the session
 *
 * OAuth secrets live only in .env and are never forwarded to the browser.
 * If GITHUB_CLIENT_ID is not set the routes respond with 501 so the rest of
 * the app continues to work without any OAuth configuration.
 */

import { Router } from 'express';
import { config } from '../config.js';

const router = Router();

const GITHUB_AUTHORIZE = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';

function oauthConfigured() {
  return Boolean(config.githubClientId && config.githubClientSecret);
}

// GET /auth/github — kick off the OAuth flow
router.get('/github', (req, res) => {
  if (!oauthConfigured()) {
    return res.status(501).json({ error: 'GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env.' });
  }

  const params = new URLSearchParams({
    client_id: config.githubClientId,
    scope: 'read:user',
    // 'state' protects against CSRF; store it in the session so we can verify it on callback
    state: Math.random().toString(36).slice(2),
  });
  req.session.oauthState = params.get('state');
  res.redirect(`${GITHUB_AUTHORIZE}?${params}`);
});

// GET /auth/github/callback — GitHub redirects here after the user approves
router.get('/github/callback', async (req, res) => {
  if (!oauthConfigured()) {
    return res.redirect(`${config.clientOrigin}?auth_error=not_configured`);
  }

  const { code, state } = req.query;

  // Verify CSRF state
  if (!state || state !== req.session.oauthState) {
    return res.redirect(`${config.clientOrigin}?auth_error=invalid_state`);
  }
  delete req.session.oauthState;

  if (!code) {
    return res.redirect(`${config.clientOrigin}?auth_error=no_code`);
  }

  try {
    // Exchange the temporary code for an access token
    const tokenRes = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: config.githubClientId,
        client_secret: config.githubClientSecret,
        code,
      }),
    });
    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error('OAuth token error:', tokenData);
      return res.redirect(`${config.clientOrigin}?auth_error=token_exchange`);
    }

    // Fetch the authenticated user's profile — only store what the UI needs
    const userRes = await fetch(GITHUB_USER_URL, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'open-source-buddy',
      },
    });
    const userData = await userRes.json();

    if (!userData.id) {
      return res.redirect(`${config.clientOrigin}?auth_error=user_fetch`);
    }

    // Persist only safe, non-secret fields in the session
    req.session.githubUser = {
      id: userData.id,
      login: userData.login,
      name: userData.name || userData.login,
      avatar_url: userData.avatar_url,
    };
    // Do NOT store the access_token in the session — we only needed it once.

    res.redirect(config.clientOrigin);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect(`${config.clientOrigin}?auth_error=server`);
  }
});

// GET /auth/me — returns the current user or null (never errors)
router.get('/me', (req, res) => {
  res.json({ user: req.session?.githubUser || null });
});

// POST /auth/logout — destroy the session
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Session destroy error:', err);
    res.json({ ok: true });
  });
});

export default router;
