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
| `gemini` | **Implemented** | Calls the Google Gemini API (`models/gemini-1.5-flash:generateContent`). Requires `GEMINI_API_KEY`. |
| `groq` | **Implemented** | Calls the Groq OpenAI-compatible Chat Completions API (`llama-3.3-70b-versatile`). Requires `GROQ_API_KEY`. |

Both `gemini` and `groq` read their API keys solely from server environment variables and return `{ markdown, plan }`.

> **Note**: Future providers should only be documented here after their implementation code is complete.

---

## The AIProvider Interface

Every provider extends `AIProvider` from `server/ai/provider.js`:

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
Each provider defines a unique name identifier string (e.g. `'mock'`, `'ollama'`, `'gemini'`, `'groq'`).

### 2. `explain(issue, opts)`
The primary method responsible for generating the explanation.
- **Parameters**:
  - `issue`: Object containing `title`, `body`, `labels` (array of strings or label objects), `repo`, `language`, `topics`, etc.
  - `opts`: Optional configuration options such as `{ context }` (e.g. repo README text) and `{ mode }` (e.g. `'beginner'`).
- **Expected Return Shape**:
  The method must return an object with:
  ```json
  {
    "markdown": "Useful Markdown string explaining the issue...",
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

export function createProvider(name, config) {
  const Provider = providers[name];

  if (!Provider) {
    throw new Error(`Unknown AI provider: ${name}`);
  }

  return new Provider(config);
}
```

If an unrecognized `AI_PROVIDER` is specified, `createProvider` throws an informative error displaying the invalid provider name.

---

## Environment Variables and Configuration

All configuration is loaded centrally in `server/config.js` via `dotenv`.

### Available Configurations:

1. **Mock Provider (Offline)**:
   ```env
   AI_PROVIDER=mock
   ```

2. **Ollama Provider (Local)**:
   ```env
   AI_PROVIDER=ollama
   OLLAMA_BASE_URL=http://127.0.0.1:11434
   OLLAMA_MODEL=llama3.2
   OLLAMA_TIMEOUT_MS=120000
   ```

3. **Gemini Provider (Cloud)**:
   ```env
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your-gemini-api-key
   GEMINI_MODEL=gemini-1.5-flash
   GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
   GEMINI_TIMEOUT_MS=120000
   ```

4. **Groq Provider (Cloud)**:
   ```env
   AI_PROVIDER=groq
   GROQ_API_KEY=your-groq-api-key
   GROQ_MODEL=llama-3.3-70b-versatile
   GROQ_BASE_URL=https://api.groq.com/openai/v1
   GROQ_TIMEOUT_MS=120000
   ```

### Security Best Practices

- **Never expose API keys or internal URLs to the browser**: All API keys, base URLs, and model configs live strictly on the server in `.env` and `server/config.js`.
- The client only receives the sanitized `{ provider, markdown, plan }` response via `POST /api/explain`.
- Never commit `.env` or credentials to Git.

---

## Testing Your Provider

1. **Test with the Mock Provider**:
   ```bash
   AI_PROVIDER=mock npm run dev
   ```
   Open `http://localhost:5173` and click **Explain this issue** on any card.

2. **Test with Groq**:
   ```bash
   AI_PROVIDER=groq GROQ_API_KEY=your_key npm run dev
   ```

3. **Test with Gemini**:
   ```bash
   AI_PROVIDER=gemini GEMINI_API_KEY=your_key npm run dev
   ```
