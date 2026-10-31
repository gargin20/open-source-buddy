import { Router } from 'express';
import ai from '../ai/index.js';

const router = Router();

router.post('/', async (req, res) => {
  const { issue } = req.body || {};
  if (!issue) {
    return res.status(400).json({ error: 'Body must include an issue' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });

  let closed = false;
  req.on('close', () => {
    closed = true;
  });

  try {
    const stream = ai.explainStream(issue);
    for await (const chunk of stream) {
      if (closed) break;
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }
    if (!closed) {
      res.write('data: [DONE]\n\n');
      res.end();
    }
  } catch (err) {
    if (!closed) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
});

export default router;
