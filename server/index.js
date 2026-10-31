import express from 'express';
import session from 'express-session';
import { config } from './config.js';
import { rateLimit } from './middleware/rateLimit.js';
import apiRouter from './routes/index.js';
import authRouter from './routes/auth.js';

const app = express();
app.use(express.json({ limit: '200kb' }));

// Session middleware — must come before auth routes and the API router
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,   // not accessible from JS — protects against XSS
      sameSite: 'lax',  // sent on top-level navigations (OAuth redirect)
      secure: false,    // set to true in production (HTTPS)
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  })
);

// OAuth routes (no rate-limit — they make outbound fetch calls themselves)
app.use('/auth', authRouter);

// Main API
app.use('/api', rateLimit, apiRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'Server error' });
});

app.listen(config.port, () => {
  console.log(`API running on http://localhost:${config.port}`);
  console.log(`GitHub mode: ${config.githubMode} | AI provider: ${config.aiProvider}`);
  if (config.githubClientId) {
    console.log('GitHub OAuth: enabled');
  } else {
    console.log('GitHub OAuth: disabled (set GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET to enable)');
  }
});
