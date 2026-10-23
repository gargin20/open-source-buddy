import { Router } from 'express';
import github from '../github/index.js';
import { computeHealthScore } from '../lib/healthScore.js';

const router = Router();

router.get('/:owner/:name/health', async (req, res, next) => {
  try {
    const { owner, name } = req.params;
    const metrics = await github.getRepoHealth(owner, name);
    if (!metrics) return res.status(404).json({ error: `Repo ${owner}/${name} not found` });
    res.json({ repo: `${owner}/${name}`, ...metrics, score: computeHealthScore(metrics) });
  } catch (err) {
    next(err);
  }
});

export default router;
