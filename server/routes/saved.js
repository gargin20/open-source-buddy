import { Router } from 'express';
import { getCurrentUserId } from '../auth/currentUser.js';
import { listSaved, addSaved, removeSaved } from '../lib/savedStore.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    res.json({ items: await listSaved(getCurrentUserId(req, res)) });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { issue } = req.body || {};
    if (!issue || issue.id == null) {
      return res.status(400).json({ error: 'Body must include an issue with an id' });
    }
    const items = await addSaved(getCurrentUserId(req, res), issue);
    res.status(201).json({ items });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    res.json({ items: await removeSaved(getCurrentUserId(req, res), req.params.id) });
  } catch (err) {
    next(err);
  }
});

export default router;
