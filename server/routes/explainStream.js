import { Router } from 'express';

const router = Router();

// TODO: stream the explanation to the browser while it is being generated
// (Server-Sent Events or a chunked response). Use ai.explainStream(issue, opts),
// which is an async generator that yields pieces of text.
router.post('/', (req, res) => {
  res.status(501).json({ error: 'Streaming is not implemented yet' });
});

export default router;
