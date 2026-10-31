import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';

// Saved issues are kept per user in one JSON file: { "<userId>": [issue, ...] }
const FILE = path.join(config.dataDir, 'saved.json');
let storeOperations = Promise.resolve();

function withStoreLock(operation) {
  const result = storeOperations.then(operation);
  storeOperations = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function readAll() {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    throw err;
  }
}

async function writeAll(data) {
  await fs.mkdir(config.dataDir, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2));
}

export async function listSaved(userId) {
  return withStoreLock(async () => {
    const all = await readAll();
    return all[userId] || [];
  });
}

export async function addSaved(userId, issue) {
  return withStoreLock(async () => {
    const all = await readAll();
    const saved = all[userId] || [];
    if (saved.some((item) => String(item.id) === String(issue.id))) return saved;

    all[userId] = [...saved, issue];
    await writeAll(all);
    return all[userId];
  });
}

export async function removeSaved(userId, id) {
  return withStoreLock(async () => {
    const all = await readAll();
    all[userId] = (all[userId] || []).filter((item) => String(item.id) !== String(id));
    await writeAll(all);
    return all[userId];
  });
}
