import { config } from '../config.js';
import { MockAIProvider } from './mock.js';
import { GeminiProvider } from './gemini.js';
import { GroqProvider } from './groq.js';
import { OllamaAIProvider } from './ollama.js';

const providers = {
  mock: MockAIProvider,
  ollama: OllamaAIProvider,
  // gemini and groq remain unimplemented.
  gemini: GeminiProvider,
  groq: GroqProvider,
};

export function createProvider(name = config.aiProvider, providerConfig = config) {
  const Provider = providers[name];

  if (!Provider) {
    throw new Error(`Unknown AI provider: ${name}`);
  }

  return new Provider(providerConfig);
}

export default createProvider(config.aiProvider, config);
