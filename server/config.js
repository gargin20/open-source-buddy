import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const isProduction = process.env.NODE_ENV === 'production';
let sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  if (isProduction) {
    throw new Error('SESSION_SECRET environment variable is required in production.');
  } else {
    sessionSecret = 'dev-only-insecure-secret';
    console.warn('Warning: Using insecure default SESSION_SECRET for development. Set SESSION_SECRET in .env.');
  }
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  githubMode: (process.env.GITHUB_MODE || 'mock').toLowerCase(),
  githubToken: process.env.GITHUB_TOKEN || '',
  aiProvider: (process.env.AI_PROVIDER || 'mock').toLowerCase(),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || process.env.OLLAMA_URL || 'http://127.0.0.1:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2',
  ollamaTimeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS || 120000),
  ollamaUrl: process.env.OLLAMA_BASE_URL || process.env.OLLAMA_URL || 'http://127.0.0.1:11434',
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:5173',
  serverBaseUrl: process.env.SERVER_BASE_URL || 'http://localhost:3001',
  githubClientId: process.env.GITHUB_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
  githubCallbackUrl:
    process.env.GITHUB_CALLBACK_URL ||
    'http://localhost:3001/api/auth/github/callback',
  sessionSecret,
  isProduction,
  perPage: 6,
  dataDir: path.join(__dirname, 'data'),
};
