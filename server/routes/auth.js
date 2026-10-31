import { Router } from 'express';
import {
  consumeOAuthState,
  createOAuthState,
  createSession,
  destroySession,
  getCurrentUser,
} from '../auth/currentUser.js';

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';

function oauthIsConfigured(config) {
  return Boolean(config.githubOAuthClientId && config.githubOAuthClientSecret);
}

function appRedirect(config, error) {
  const destination = new URL('/', config.appUrl);
  if (error) destination.searchParams.set('authError', error);
  return destination.toString();
}

export function createAuthRouter({ config, fetchImpl = fetch }) {
  const router = Router();

  router.get('/github', (req, res) => {
    if (!oauthIsConfigured(config)) {
      return res.status(503).json({ error: 'GitHub sign-in is not configured on this server' });
    }

    const state = createOAuthState(res);
    const authorization = new URL(GITHUB_AUTHORIZE_URL);
    authorization.searchParams.set('client_id', config.githubOAuthClientId);
    authorization.searchParams.set('redirect_uri', config.githubOAuthCallbackUrl);
    authorization.searchParams.set('scope', 'read:user');
    authorization.searchParams.set('state', state);
    return res.redirect(302, authorization.toString());
  });

  router.get('/github/callback', async (req, res) => {
    if (!oauthIsConfigured(config)) {
      return res.redirect(303, appRedirect(config, 'not_configured'));
    }

    if (req.query.error) {
      consumeOAuthState(req, res, '');
      return res.redirect(303, appRedirect(config, 'access_denied'));
    }

    if (!consumeOAuthState(req, res, req.query.state)) {
      return res.redirect(303, appRedirect(config, 'invalid_state'));
    }
    if (typeof req.query.code !== 'string' || !req.query.code) {
      return res.redirect(303, appRedirect(config, 'missing_code'));
    }

    try {
      const tokenResponse = await fetchImpl(GITHUB_TOKEN_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: config.githubOAuthClientId,
          client_secret: config.githubOAuthClientSecret,
          code: req.query.code,
          redirect_uri: config.githubOAuthCallbackUrl,
        }),
      });
      if (!tokenResponse.ok) {
        return res.redirect(303, appRedirect(config, 'oauth_failed'));
      }

      const tokenData = await tokenResponse.json();
      if (typeof tokenData.access_token !== 'string' || !tokenData.access_token) {
        return res.redirect(303, appRedirect(config, 'oauth_failed'));
      }

      const profileResponse = await fetchImpl(GITHUB_USER_URL, {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': 'open-source-buddy',
        },
      });
      if (!profileResponse.ok) {
        return res.redirect(303, appRedirect(config, 'oauth_failed'));
      }

      const profile = await profileResponse.json();
      if (
        (typeof profile.id !== 'number' && typeof profile.id !== 'string') ||
        !String(profile.id) ||
        typeof profile.login !== 'string' ||
        !profile.login
      ) {
        return res.redirect(303, appRedirect(config, 'oauth_failed'));
      }

      createSession(
        {
          id: String(profile.id),
          login: String(profile.login),
          name: typeof profile.name === 'string' ? profile.name : null,
        },
        res,
      );
      return res.redirect(303, appRedirect(config));
    } catch (error) {
      console.error('GitHub OAuth callback failed:', error.message);
      return res.redirect(303, appRedirect(config, 'oauth_failed'));
    }
  });

  router.get('/me', (req, res) => {
    const { user, expired } = getCurrentUser(req, res);
    res.json({
      user: user ? { login: user.login, name: user.name } : null,
      expired,
      enabled: oauthIsConfigured(config),
    });
  });

  router.post('/logout', (req, res) => {
    destroySession(req, res);
    res.status(204).end();
  });

  return router;
}
