import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const secureCookieSetting = (process.env.AUTH_COOKIE_SECURE || '').trim().toLowerCase();

export const config = {
  port: Number(process.env.PORT) || 3001,
  githubMode: (process.env.GITHUB_MODE || 'mock').toLowerCase(),
  githubToken: process.env.GITHUB_TOKEN || '',
  githubOAuthClientId: process.env.GITHUB_OAUTH_CLIENT_ID || '',
  githubOAuthClientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET || '',
  githubOAuthCallbackUrl:
    process.env.GITHUB_OAUTH_CALLBACK_URL || 'http://localhost:3001/api/auth/github/callback',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  authCookieSecure:
    secureCookieSetting === ''
      ? process.env.NODE_ENV === 'production'
      : secureCookieSetting === 'true',
  aiProvider: (process.env.AI_PROVIDER || 'mock').toLowerCase(),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  perPage: 6,
  dataDir: path.join(__dirname, 'data'),
};
