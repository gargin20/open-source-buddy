import { Router } from 'express';
import { config } from '../config.js';
import github from '../github/index.js';
import { filterByLanguage, filterByTopic } from '../lib/filters.js';
import { sortIssues } from '../lib/sort.js';
import { paginate } from '../lib/paginate.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { q = '', language = '', topic = '', sort = '', page = '1' } = req.query;

    // github.listIssues now returns { items, cached }
    const { items: allItems, cached } = await github.listIssues({ q, language, topic });

    let items = filterByLanguage(allItems, language);
    items = filterByTopic(items, topic);
    items = sortIssues(items, sort);

    const result = paginate(items, Number(page) || 1, config.perPage);
    // Surface cache status so the client / tests can see it
    res.json({ ...result, cached });
  } catch (err) {
    next(err);
  }
});

export default router;
