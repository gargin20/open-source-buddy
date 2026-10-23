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
    let items = await github.listIssues({ q, language, topic });
    items = filterByLanguage(items, language);
    items = filterByTopic(items, topic);
    items = sortIssues(items, sort);
    res.json(paginate(items, Number(page) || 1, config.perPage));
  } catch (err) {
    next(err);
  }
});

export default router;
