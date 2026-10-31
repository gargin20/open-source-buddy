import { Router } from 'express';
import { config } from '../config.js';
import { createSession, getCurrentUser, removeSession } from '../auth/currentUser.js';

const router = Router();

router.get('/login', (req, res) => {
  if (!config.githubClientId) {
    return res.status(500).json({ error: 'GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env' });
  }
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/callback`;
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${config.githubClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user`;
  res.redirect(authUrl);
});

router.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.redirect('/?auth_error=missing_code');
  }
  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        client_id: config.githubClientId,
        client_secret: config.githubClientSecret,
        code
      })
    });
    const tokenData = await tokenRes.json();
    if (tokenData.error || !tokenData.access_token) {
      return res.redirect('/?auth_error=' + encodeURIComponent(tokenData.error_description || 'oauth_failed'));
    }

    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'open-source-buddy'
      }
    });
    const userData = await userRes.json();
    const sessionToken = createSession({
      id: userData.id,
      login: userData.login,
      name: userData.name || userData.login,
      avatar_url: userData.avatar_url
    });

    res.setHeader('Set-Cookie', `session_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
    res.redirect('/');
  } catch (err) {
    res.redirect('/?auth_error=' + encodeURIComponent(err.message));
  }
});

router.get('/me', (req, res) => {
  const user = getCurrentUser(req);
  res.json({ user });
});

router.post('/logout', (req, res) => {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/session_token=([^;]+)/);
  const token = (match && match[1]) || req.headers['authorization']?.replace(/^Bearer\s+/i, '');
  if (token) removeSession(token);
  res.setHeader('Set-Cookie', 'session_token=; Path=/; HttpOnly; Max-Age=0');
  res.json({ ok: true });
});

export default router;
