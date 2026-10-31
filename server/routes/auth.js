import express from 'express';
import crypto from 'node:crypto';
import { config } from '../config.js';

const router = express.Router();

function redirectWithError(res, reason) {
  const url = new URL(config.appBaseUrl);
  url.searchParams.set('auth', 'error');
  url.searchParams.set('reason', reason);
  return res.redirect(url.toString());
}

router.get('/github', (req, res) => {
  if (!config.githubClientId || !config.githubClientSecret || !config.githubCallbackUrl) {
    return res.status(500).json({ error: 'GitHub OAuth is not configured.' });
  }

  const state = crypto.randomBytes(16).toString('hex');
  if (req.session) {
    req.session.oauthState = state;
  }

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', config.githubClientId);
  url.searchParams.set('redirect_uri', config.githubCallbackUrl);
  url.searchParams.set('scope', 'read:user user:email');
  url.searchParams.set('state', state);

  res.redirect(url.toString());
});

router.get('/github/callback', async (req, res) => {
  const { code, state } = req.query;

  try {
    if (typeof code !== 'string' || !code) {
      return redirectWithError(res, 'missing_code');
    }

    if (state !== req.session?.oauthState) {
      return redirectWithError(res, 'invalid_state');
    }

    if (req.session) {
      delete req.session.oauthState;
    }

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: config.githubClientId,
        client_secret: config.githubClientSecret,
        code,
        redirect_uri: config.githubCallbackUrl,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error || !tokenData.access_token) {
      throw new Error(tokenData.error_description || tokenData.error || 'GitHub token exchange failed.');
    }

    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'open-source-buddy',
      },
    });

    if (!userResponse.ok) {
      throw new Error(`GitHub user lookup failed with HTTP ${userResponse.status}.`);
    }

    const githubUser = await userResponse.json();

    req.session.user = {
      id: `github:${githubUser.id}`,
      provider: 'github',
      githubId: githubUser.id,
      login: githubUser.login,
      name: githubUser.name || githubUser.login,
      avatarUrl: githubUser.avatar_url,
      accessToken: tokenData.access_token,
    };

    req.session.save((sessionError) => {
      if (sessionError) {
        return redirectWithError(res, 'session_save_failed');
      }

      const successUrl = new URL(config.appBaseUrl);
      successUrl.searchParams.set('auth', 'success');
      res.redirect(successUrl.toString());
    });
  } catch (error) {
    if (req.session) delete req.session.oauthState;

    const failureUrl = new URL(config.appBaseUrl);
    failureUrl.searchParams.set('auth', 'error');
    failureUrl.searchParams.set('reason', error.message || 'oauth_failed');
    res.redirect(failureUrl.toString());
  }
});

router.get('/me', (req, res) => {
  const user = req.session?.user;

  if (!user?.id) {
    return res.json({ authenticated: false, user: null });
  }

  const { accessToken, ...safeUser } = user;
  res.json({ authenticated: true, user: safeUser });
});

router.post('/logout', (req, res) => {
  if (!req.session) {
    res.clearCookie('osb_session');
    return res.json({ authenticated: false, user: null });
  }

  req.session.destroy((error) => {
    res.clearCookie('osb_session');

    if (error) {
      return res.status(500).json({ error: 'Logout failed.', authenticated: true });
    }

    res.json({ authenticated: false, user: null });
  });
});

export default router;

