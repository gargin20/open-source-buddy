import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  port: Number(process.env.PORT) || 3001,
  githubMode: (process.env.GITHUB_MODE || 'mock').toLowerCase(),
  githubToken: process.env.GITHUB_TOKEN || '',
  aiProvider: (process.env.AI_PROVIDER || 'mock').toLowerCase(),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  // GitHub OAuth
  githubClientId: process.env.GITHUB_CLIENT_ID || '',
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  oauthCallbackUrl: process.env.OAUTH_CALLBACK_URL || 'http://localhost:3001/api/auth/callback',
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  perPage: 6,
  dataDir: path.join(__dirname, 'data'),
};
