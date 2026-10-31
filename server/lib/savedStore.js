import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';

// Saved issues are kept per user in one JSON file: { "<userId>": [issue, ...] }
const getFile = () => path.join(config.dataDir, 'saved.json');

async function readAll() {
  try {
    return JSON.parse(await fs.readFile(getFile(), 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    throw err;
  }
}

async function writeAll(data) {
  await fs.mkdir(config.dataDir, { recursive: true });
  await fs.writeFile(getFile(), JSON.stringify(data, null, 2));
}

export async function listSaved(userId) {
  const all = await readAll();
  return all[userId] || [];
}

export async function addSaved(userId, issue) {
  const all = await readAll();
  all[userId] = [...(all[userId] || []), issue];
  await writeAll(all);
  return all[userId];
}

export async function removeSaved(userId, id) {
  const all = await readAll();
  all[userId] = (all[userId] || []).filter((item) => String(item.id) !== String(id));
  await writeAll(all);
  return all[userId];
}
