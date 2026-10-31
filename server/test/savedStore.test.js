import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { config } from '../config.js';
import { addSaved, listSaved, removeSaved } from '../lib/savedStore.js';

test('saved issues are isolated by anonymous browser and GitHub user IDs', async () => {
  const previousDataDir = config.dataDir;
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'open-source-buddy-saved-'));
  config.dataDir = temporaryDirectory;

  try {
    const issue = { id: 42, title: 'Example issue' };
    await addSaved('github:123', issue);
    await addSaved('anonymous:browser-a', { id: 7, title: 'Anonymous issue' });

    assert.deepEqual(await listSaved('github:123'), [issue]);
    assert.deepEqual(await listSaved('anonymous:browser-a'), [
      { id: 7, title: 'Anonymous issue' },
    ]);
    assert.deepEqual(await listSaved('github:456'), []);
    assert.deepEqual(await listSaved('anonymous:browser-b'), []);
    assert.deepEqual(await removeSaved('github:123', 42), []);
    assert.deepEqual(await listSaved('anonymous:browser-a'), [
      { id: 7, title: 'Anonymous issue' },
    ]);
  } finally {
    config.dataDir = previousDataDir;
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
});
