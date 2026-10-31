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
  perPage: 6,
  dataDir: path.join(__dirname, 'data'),

  // GitHub OAuth — create an OAuth App at https://github.com/settings/developers
  // Callback URL must be: http://localhost:3001/auth/github/callback
  githubClientId: process.env.GITHUB_CLIENT_ID || '',
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || '',

  // Secret used to sign the session cookie. Change this to a long random string.
  sessionSecret: process.env.SESSION_SECRET || 'change-me-in-production',

  // Where to send the browser after login / logout
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};
