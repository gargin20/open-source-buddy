import { config } from '../config.js';
import { MockAIProvider } from './mock.js';
import { OllamaAIProvider } from './ollama.js';
import { GeminiAIProvider } from './gemini.js';
import { GroqAIProvider } from './groq.js';

const providers = {
  mock: MockAIProvider,
  ollama: OllamaAIProvider,
  gemini: GeminiAIProvider,
  groq: GroqAIProvider,
};

export function createProvider(name = config.aiProvider, providerConfig = config) {
  const Provider = providers[name];

  if (!Provider) {
    throw new Error(`Unknown AI provider: ${name}`);
  }

  return new Provider(providerConfig);
}

export default createProvider(config.aiProvider, config);
