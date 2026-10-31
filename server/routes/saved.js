import { Router } from 'express';
import { getCurrentUserId } from '../auth/currentUser.js';
import { listSaved, addSaved, removeSaved, clearSaved } from '../lib/savedStore.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    res.json({ items: await listSaved(getCurrentUserId(req)) });
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
    const items = await addSaved(getCurrentUserId(req), issue);
    res.status(201).json({ items });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/saved — clear ALL saved issues for the current user
router.delete('/', async (req, res, next) => {
  try {
    const items = await clearSaved(getCurrentUserId(req));
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/saved/:id — remove a single saved issue
router.delete('/:id', async (req, res, next) => {
  try {
    res.json({ items: await removeSaved(getCurrentUserId(req), req.params.id) });
  } catch (err) {
    next(err);
  }
});

export default router;
