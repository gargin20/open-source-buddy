import fsPromises from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { config } from '../config.js';

const DATA_DIR = config?.dataDir || path.resolve(process.cwd(), 'server/data');
const SAVED_FILE = path.join(DATA_DIR, 'saved.json');

async function readDatabase() {
  try {
    const raw = await fsPromises.readFile(SAVED_FILE, 'utf8');
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return { anonymous: parsed };
    }

    if (parsed && typeof parsed === 'object') {
      return parsed;
    }

    return {};
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

async function writeDatabase(database) {
  await fsPromises.mkdir(DATA_DIR, { recursive: true });
  await fsPromises.writeFile(SAVED_FILE, JSON.stringify(database, null, 2), 'utf8');
}

export async function listSaved(userId = 'anonymous') {
  const database = await readDatabase();
  return Array.isArray(database[userId]) ? database[userId] : [];
}

export async function addSaved(userId = 'anonymous', issue) {
  const database = await readDatabase();
  const existing = Array.isArray(database[userId]) ? database[userId] : [];

  const saved = {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    userId,
    issue,
    ...issue,
  };

  database[userId] = [...existing, saved];
  await writeDatabase(database);
  return saved;
}

export async function removeSaved(userId = 'anonymous', id) {
  const database = await readDatabase();
  const existing = Array.isArray(database[userId]) ? database[userId] : [];
  const next = existing.filter(
    (item) => item.id !== id && String(item.id) !== String(id) && String(item.issue?.id) !== String(id)
  );

  if (next.length === existing.length) {
    return false;
  }

  database[userId] = next;
  await writeDatabase(database);
  return true;
}
