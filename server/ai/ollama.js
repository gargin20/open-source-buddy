import { AIProvider, NotImplementedError } from './provider.js';
import { config } from '../config.js';

export class OllamaProvider extends AIProvider {
  get name() {
    return 'ollama';
  }

  async explain(issue, { context } = {}) {
    // TODO: call a local Ollama server at config.ollamaUrl and return
    // { markdown, plan } in the same shape as the mock provider.
    throw new NotImplementedError('Ollama provider is not implemented yet (see server/ai/ollama.js)');
  }
}
