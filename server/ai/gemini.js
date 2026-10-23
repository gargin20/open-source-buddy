import { AIProvider, NotImplementedError } from './provider.js';
import { config } from '../config.js';

export class GeminiProvider extends AIProvider {
  get name() {
    return 'gemini';
  }

  async explain(issue, { context } = {}) {
    // TODO: call the Gemini API using config.geminiApiKey and return
    // { markdown, plan } in the same shape as the mock provider.
    throw new NotImplementedError('Gemini provider is not implemented yet (see server/ai/gemini.js)');
  }
}
