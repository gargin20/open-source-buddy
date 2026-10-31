import { Router } from 'express';
import { config } from '../config.js';
import { getSession, createSession, destroySession } from '../auth/session.js';

const router = Router();
const GH_API = 'https://api.github.com';

// GET /api/auth/login — redirect to GitHub OAuth consent page
router.get('/login', (req, res) => {
  if (!config.githubClientId) {
    return res.status(501).json({ error: 'GitHub OAuth is not configured. Add GITHUB_CLIENT_ID to .env' });
  }
  const params = new URLSearchParams({
    client_id: config.githubClientId,
    redirect_uri: config.oauthCallbackUrl,
    scope: 'read:user',
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// GET /api/auth/callback — GitHub redirects here after the user approves
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect('/?auth=error');

  try {
    // Exchange the temporary code for an access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: config.githubClientId,
        client_secret: config.githubClientSecret,
        code,
        redirect_uri: config.oauthCallbackUrl,
      }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.error || !tokenData.access_token) {
      console.error('OAuth token error:', tokenData.error_description);
      return res.redirect('/?auth=error');
    }

    // Fetch the authenticated user's public profile
    const userRes = await fetch(`${GH_API}/user`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'open-source-buddy',
        Accept: 'application/vnd.github+json',
      },
    });
    if (!userRes.ok) return res.redirect('/?auth=error');
    const ghUser = await userRes.json();

    // Store only what the UI needs — the raw access token stays server-side
    // (and is intentionally NOT stored; re-auth is required after restart)
    createSession(res, {
      userId: String(ghUser.login),
      login: ghUser.login,
      avatarUrl: ghUser.avatar_url,
    });

    res.redirect('/');
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect('/?auth=error');
  }
});

// GET /api/auth/me — safe endpoint the client polls to know who is signed in
router.get('/me', (req, res) => {
  const session = getSession(req);
  if (!session) return res.json({ user: null });
  // Only return safe fields — never the session ID or any token
  res.json({ user: { login: session.login, avatarUrl: session.avatarUrl } });
});

// POST /api/auth/logout — invalidate the session and clear the cookie
router.post('/logout', (req, res) => {
  destroySession(req, res);
  res.json({ ok: true });
});

export default router;
