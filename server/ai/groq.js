import { AIProvider, NotImplementedError } from './provider.js';
import { config } from '../config.js';

export class GroqProvider extends AIProvider {
  get name() {
    return 'groq';
  }

  async explain(issue, { context } = {}) {
    // TODO: call the Groq API using config.groqApiKey and return
    // { markdown, plan } in the same shape as the mock provider.
    throw new NotImplementedError('Groq provider is not implemented yet (see server/ai/groq.js)');
  }
}
