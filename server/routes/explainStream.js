import { Router } from 'express';
import ai from '../ai/index.js'; 

const router = Router();

router.post('/', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const { issue, opts } = req.body;

  try {
    const stream = await ai.explainStream(issue, opts);
    
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }
    
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('Streaming error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Failed to stream explanation.' })}\n\n`);
    res.end();
  }

  req.on('close', () => {
    console.log('Client disconnected, aborting stream.');
    res.end();
  });
});

export default router;