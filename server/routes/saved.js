import express from 'express';
import * as savedStore from '../lib/savedStore.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    res.json(await savedStore.listSaved(req.userId));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const issue = req.body?.issue;

  if (!issue || typeof issue !== 'object') {
    return res.status(400).json({ error: 'A valid issue object is required.' });
  }

  try {
    const saved = await savedStore.addSaved(req.userId, issue);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const removed = await savedStore.removeSaved(req.userId, req.params.id);

    if (!removed) {
      return res.status(404).json({ error: 'Saved issue not found.' });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
