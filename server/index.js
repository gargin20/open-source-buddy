import express from 'express';
import { config } from './config.js';
import { rateLimit } from './middleware/rateLimit.js';
import apiRouter from './routes/index.js';

const app = express();
app.use(express.json({ limit: '200kb' }));
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
});
