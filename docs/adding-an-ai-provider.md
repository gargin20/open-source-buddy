# Adding an AI provider

This guide explains how to add an AI provider to Open Source Buddy. Providers run in the Node.js server; API credentials must never be exposed to the browser.

## Provider interface

All providers extend `AIProvider` from `server/ai/provider.js`. The interface requires:

- A `name` property that returns a string. Use the same name as the provider's `AI_PROVIDER` value.
- An asynchronous `explain(issue, opts)` method.

`issue` is an issue object with fields such as `title`, `body`, `labels`, `repo`, `language`, and `topics`. `opts` may contain `context`, extra text such as repository documentation.

`explain()` must return an object with this shape:

```js
{
  markdown: 'A readable explanation in Markdown',
  plan: ['First step', 'Next step'],
}
```

`markdown` must be a string and `plan` must be an array of strings. Keep this response shape consistent so the API and client can use any provider.

## Optional streaming

Providers can override `async *explainStream(issue, opts)` to yield text chunks as they are generated. The base class already implements this method by calling `explain()` and yielding its complete `markdown` as one chunk, so providers do not need to implement streaming.

The `/api/explain/stream` route currently returns `501`; streaming is not yet available through the HTTP API. Implementing `explainStream()` alone does not enable that route.

## Registered providers and selection

`server/ai/index.js` selects a provider from `AI_PROVIDER` using the provider registry. Selection is case-insensitive, and the default is `mock`. These names are currently registered:

| `AI_PROVIDER` value | Status |
|---|---|
| `mock` | Implemented; creates an explanation from issue fields without network access or API keys. |
| `gemini` | Registered, but not implemented; calling it raises `NotImplementedError`. |
| `groq` | Registered, but not implemented; calling it raises `NotImplementedError`. |
| `ollama` | Registered, but not implemented; calling it raises `NotImplementedError`. |

Register a new provider by importing its class in `server/ai/index.js` and adding its name-to-class entry to the `providers` object. An unregistered or misspelled value causes the server to report the valid registered names and exit during startup.

## Configuration and environment variables

Choose the environment variables required by the provider. For a hosted service, this will normally include a private API key; a local service may instead need a URL. Add each variable to:

1. The root `.env.example`, with an empty value or safe local default.
2. `server/config.js`, read from `process.env` and exported in the `config` object.
3. The provider implementation, which should read credentials from `config` rather than directly from browser code.

For example, a hosted provider could use a variable named `EXAMPLE_AI_API_KEY`. Document whether it is required and how to obtain it. Do not put real credentials in `.env.example`.

The existing environment variables are:

| Variable | Purpose |
|---|---|
| `AI_PROVIDER` | Selects the registered provider; defaults to `mock`. |
| `GEMINI_API_KEY` | Intended for Gemini; its provider is currently not implemented. |
| `GROQ_API_KEY` | Intended for Groq; its provider is currently not implemented. |
| `OLLAMA_URL` | Intended for a local Ollama server; its provider is currently not implemented. |

The existing mock provider does not require any API key. `GITHUB_MODE=mock` is separate: it selects sample GitHub issue data, not the AI provider.

## Implementation outline

Create a module such as `server/ai/example.js`:

```js
import { AIProvider } from './provider.js';
import { config } from '../config.js';

export class ExampleProvider extends AIProvider {
  get name() {
    return 'example';
  }

  async explain(issue, { context } = {}) {
    // Send issue.title, issue.body, and optional context to the AI service.
    // Read the credential from config; do not return it to the caller.
    const markdown = `# ${issue.title}\n\nExplanation goes here.`;
    const plan = ['Understand the issue', 'Make and test a focused change'];
    return { markdown, plan };
  }
}
```

Replace the placeholder with the service's API call and error handling. Then add the provider's environment variable to `.env.example` and `server/config.js`, and register the class in `server/ai/index.js`:

```js
import { ExampleProvider } from './example.js';

const providers = {
  mock: MockAIProvider,
  gemini: GeminiProvider,
  groq: GroqProvider,
  ollama: OllamaProvider,
  example: ExampleProvider,
};
```

Set `AI_PROVIDER=example` in the root `.env` to select it. Keep `.env` out of version control.

## Test with mock GitHub data

Use the existing mock GitHub data so you can test the provider without depending on live GitHub:

1. In the root `.env`, set `GITHUB_MODE=mock` and `AI_PROVIDER=example` (or `AI_PROVIDER=mock` to verify the default provider).
2. Start the app from the repository root with `npm install` and `npm run dev`.
3. Send a sample issue to the API:

```bash
curl -X POST http://localhost:3001/api/explain \
  -H "Content-Type: application/json" \
  -d "{\"issue\":{\"title\":\"Document setup\",\"body\":\"Add setup instructions.\",\"labels\":[\"documentation\"],\"repo\":\"owner/repo\",\"number\":1}}"
```

In Windows PowerShell, you can send the same request with:

```powershell
$body = @{
  issue = @{
    title = 'Document setup'
    body = 'Add setup instructions.'
    labels = @('documentation')
    repo = 'owner/repo'
    number = 1
  }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/api/explain' -ContentType 'application/json' -Body $body
```

The response should include the provider name and your `{ "markdown": "...", "plan": [...] }` result. With `AI_PROVIDER=mock`, this request should work offline and without AI credentials. With a new hosted provider selected, GitHub data still comes from mock fixtures, but the AI provider itself may require internet access and its configured API key.

## Keep credentials on the server

Load provider secrets through `server/config.js` from the root `.env`. Make calls to the AI service from server-side code only. Never put API keys in `client/`, a `VITE_` environment variable, frontend code, or an API response. The browser should call the app's backend endpoint; the backend uses the secret and returns only the explanation.
