import { Router } from 'express';
import { config } from '../config.js';
import { createProvider } from '../ai/index.js';
import { buildContext } from '../ai/rag.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { issue } = req.body || {};
    if (!issue || !issue.title) {
      return res.status(400).json({ error: 'Body must include an issue with a title' });
    }
    const context = await buildContext(issue);
    const provider = createProvider(config.aiProvider, config);
    const result = await provider.explain(issue, { context, ...(req.body?.opts || {}) });

    if (!result || typeof result.markdown !== 'string' || !Array.isArray(result.plan)) {
      throw new Error('AI provider returned an invalid explanation shape.');
    }

    res.json({ provider: provider.name, ...result });
  } catch (err) {
    if (err.code === 'NOT_IMPLEMENTED') err.status = 501;
    res.status(err.status || 500).json({
      error: err.message || 'Could not generate an explanation.',
      message: err.message || 'Could not generate an explanation.',
    });
  }
});

export default router;
