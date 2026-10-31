import { Router } from 'express';
import github from '../github/index.js';
import { computeHealthScore } from '../lib/healthScore.js';

const router = Router();

router.get('/:owner/:name/health', async (req, res, next) => {
  try {
    const { owner, name } = req.params;
    const result = await github.getRepoHealth(owner, name);
    if (!result) return res.status(404).json({ error: `Repo ${owner}/${name} not found` });

    // result already contains { ...metrics, cached: bool }
    res.json({ repo: `${owner}/${name}`, ...result, score: computeHealthScore(result) });
  } catch (err) {
    next(err);
  }
});

export default router;
