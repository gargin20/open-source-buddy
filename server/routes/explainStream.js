import { Router } from 'express';
import ai from '../ai/index.js';

const router = Router();

router.post('/', async (req, res) => {
  const { issue } = req.body || {};
  if (!issue || !issue.title) {
    return res.status(400).json({ error: 'Body must include an issue with a title' });
  }

  res.status(200);
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  let closed = false;
  res.on('close', () => {
    closed = true;
  });

  function send(event, data) {
    if (closed) return;
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  try {
    send('start', { provider: ai.name });
    for await (const chunk of ai.explainStream(issue, {})) {
      if (closed) return;
      if (chunk) send('chunk', { text: chunk });
    }
    send('done', {});
  } catch (err) {
    send('error', {
      error: err.message || 'Could not generate the explanation',
      status: err.status || 500,
    });
  } finally {
    if (!res.writableEnded && !res.destroyed) res.end();
  }
});

export default router;
