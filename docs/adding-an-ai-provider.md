# Adding an AI Provider to Open Source Buddy

This guide explains how to implement and configure a new AI provider in Open Source Buddy.

---

## Architecture Overview

All AI providers implement a common interface defined in `server/ai/provider.js`. The backend selects the active provider based on the `AI_PROVIDER` environment variable configured in `.env`.

### Provider Status

| Provider | Status | Description |
|---|---|---|
| `mock` | **Implemented** | Offline, template-based explanation from issue title, body, and labels. |
| `ollama` | **Implemented** | Calls a local Ollama server via `POST /api/generate` (defaults to `http://127.0.0.1:11434`, model `llama3.2`). No API keys required. |
| `gemini` | *Not implemented* | Stub in `server/ai/gemini.js`. Requires `GEMINI_API_KEY`. |
| `groq` | *Not implemented* | Stub in `server/ai/groq.js`. Requires `GROQ_API_KEY`. |

---

## The AIProvider Interface

Every provider must extend `AIProvider` from `server/ai/provider.js`:

```js
import { AIProvider } from './provider.js';

export class CustomAIProvider extends AIProvider {
  get name() {
    return 'custom';
  }

  async explain(issue, opts = {}) {
    // Return { markdown, plan }
  }
}
```

### 1. `name` (Getter)
Each provider must define a unique name identifier string (e.g. `'mock'`, `'ollama'`, `'gemini'`).

### 2. `explain(issue, opts)`
The primary method responsible for generating the explanation.
- **Parameters**:
  - `issue`: Object containing `title`, `body`, `labels` (array of strings or label objects), `repo`, `language`, `topics`, etc.
  - `opts`: Optional configuration options such as `{ context }` (e.g. repo README text) and `{ mode }` (e.g. `'beginner'`).
- **Expected Return Shape**:
  The method must return an object with:
  ```json
  {
    "markdown": "Plain Markdown string explaining the issue...",
    "plan": [
      "Step 1: ...",
      "Step 2: ...",
      "Step 3: ..."
    ]
  }
  ```

### 3. `explainStream(issue, opts)` (Optional Streaming)
`AIProvider` provides a default fallback implementation of `explainStream` which awaits `explain(issue, opts)` and yields `result.markdown`. Providers that support streaming tokens can override `async *explainStream(issue, opts)` to yield chunks incrementally.

---

## Provider Selection

Provider registration and instantiation happen in `server/ai/index.js`:

```js
import { config } from '../config.js';
import { MockAIProvider } from './mock.js';
import { OllamaAIProvider } from './ollama.js';
import { GeminiProvider } from './gemini.js';
import { GroqProvider } from './groq.js';

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
```

If an unrecognized `AI_PROVIDER` is specified, `createProvider` throws an informative error displaying the invalid provider name.

---

## Environment Variables and Configuration

All configuration is loaded centrally in `server/config.js` via `dotenv`.

To configure Ollama:
- `AI_PROVIDER`: Set to `ollama`.
- `OLLAMA_BASE_URL`: Base URL of the Ollama server (default: `http://127.0.0.1:11434`).
- `OLLAMA_MODEL`: Model name to use (default: `llama3.2`).
- `OLLAMA_TIMEOUT_MS`: Request timeout in milliseconds (default: `120000`).

### Security Best Practices

- **Never expose credentials or internal URLs to the browser**: API keys, internal base URLs, and model configs must live strictly on the server in `.env` and `server/config.js`.
- The client only receives the sanitized `{ provider, markdown, plan }` response via `POST /api/explain`.
- Never commit `.env` to Git.

---

## Testing Your Provider

1. **Test with the Mock Provider**:
   Verify the default experience works without external services:
   ```bash
   AI_PROVIDER=mock npm run dev
   ```
   Open `http://localhost:5173` and click **Explain this issue** on any card.

2. **Test with Ollama**:
   Ensure Ollama is installed and running:
   ```bash
   ollama run llama3.2
   ```
   In `.env`:
   ```env
   AI_PROVIDER=ollama
   OLLAMA_BASE_URL=http://127.0.0.1:11434
   OLLAMA_MODEL=llama3.2
   ```
   Run the dev server and test generating an explanation:
   ```bash
   npm run dev
   ```
   If Ollama is stopped or unreachable, the server returns a clear error message indicating that Ollama could not be reached at the configured base URL.

