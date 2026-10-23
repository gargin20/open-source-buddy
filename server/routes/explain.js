import { Router } from 'express';
import ai from '../ai/index.js';
import { buildContext } from '../ai/rag.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { issue } = req.body || {};
    if (!issue || !issue.title) {
      return res.status(400).json({ error: 'Body must include an issue with a title' });
    }
    const context = await buildContext(issue);
    const result = await ai.explain(issue, { context });
    res.json({ provider: ai.name, ...result });
  } catch (err) {
    if (err.code === 'NOT_IMPLEMENTED') err.status = 501;
    next(err);
  }
});

export default router;
