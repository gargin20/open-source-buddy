# Adding an AI Provider

This guide explains how to implement, configure, and test a new AI provider in Open Source Buddy.

---

## Overview

Open Source Buddy uses AI providers to generate beginner-friendly explanations for GitHub issues. When a user clicks **Explain this issue**, the server sends the issue details to the configured AI provider, which returns:

1. A **plain-English markdown summary** of the issue and files likely involved.
2. A **step-by-step starting plan** for the contributor.

All provider logic lives exclusively on the Node.js backend under `server/ai/`.

---

## The Provider Interface (`server/ai/provider.js`)

Every AI provider extends the base class `AIProvider` exported by [`server/ai/provider.js`](file:///server/ai/provider.js):

```javascript
export class AIProvider {
  get name() {
    throw new Error('Provider must define a name');
  }

  async explain(issue, opts) {
    throw new Error('Provider must implement explain()');
  }

  async *explainStream(issue, opts) {
    const result = await this.explain(issue, opts);
    yield result.markdown;
  }
}

export class NotImplementedError extends Error {
  constructor(message) {
    super(message);
    this.code = 'NOT_IMPLEMENTED';
  }
}
```

### 1. The `name` Property

- **Type**: `string` (getter property `get name()`)
- **Required**: Yes. The base class throws `Error('Provider must define a name')` if not implemented.
- **Description**: A lowercase identifier for the provider (for example, `'mock'`, `'gemini'`, `'groq'`, `'ollama'`, `'openai'`).
- **Usage**:
  - Matches the key registered in [`server/ai/index.js`](file:///server/ai/index.js).
  - Included in the API response: `{ provider: ai.name, ...result }`.
  - Displayed in the frontend UI badge inside `ExplainPanel` (`AI provider: <name>`).

### 2. The `explain(issue, opts)` Method

- **Signature**: `async explain(issue, { context } = {})`
- **Required**: Yes. The base class throws `Error('Provider must implement explain()')` if not implemented.
- **Parameters**:
  - `issue` (`object`): The GitHub issue to explain, containing:
    - `issue.title` (`string`, required): Issue title (e.g., `"Fix broken link in footer"`).
    - `issue.body` (`string`): Full markdown description or issue body.
    - `issue.labels` (`string[]`): Array of label names (e.g., `["good first issue", "bug"]`).
    - `issue.repo` (`string`): Repository in `owner/repo` format (e.g., `"facebook/react"`).
    - `issue.language` (`string`): Primary programming language of the repo.
    - `issue.topics` (`string[]`): Repository topic tags.
    - `issue.number` (`number | undefined`): Issue number if present.
  - `opts` (`object`, optional):
    - `opts.context` (`string`): Additional context gathered by Retrieval-Augmented Generation (RAG) in [`server/ai/rag.js`](file:///server/ai/rag.js), such as trimmed `README.md` or `CONTRIBUTING.md` excerpts from the issue's repository. Defaults to an empty string if not available.

### 3. Expected Response Shape: `{ markdown, plan }`

Your `explain` method must return a Promise resolving to an object with the following shape:

```javascript
{
  markdown: string, // Formatted markdown for the explanation panel
  plan: string[]    // Array of sequential action steps for the contributor
}
```

| Field | Type | Description |
|---|---|---|
| `markdown` | `string` | Formatted GitHub-flavored markdown. Rendered directly in the client by `<Markdown text={result.markdown} />`. Typically includes sections such as plain-English explanation, likely files, and advice. |
| `plan` | `string[]` | Ordered array of concise step-by-step strings (e.g. `["Fork and clone repo", "Run tests locally", ...]`). Used by the frontend `CopyPlanButton` component to copy actionable steps to clipboard. |

> [!NOTE]
> The server route [`server/routes/explain.js`](file:///server/routes/explain.js) automatically merges the provider name into the final HTTP response:
> `res.json({ provider: ai.name, ...result })`.

### 4. Optional Streaming Support (`explainStream`)

The base class provides an async generator method:

```javascript
async *explainStream(issue, opts) {
  const result = await this.explain(issue, opts);
  yield result.markdown;
}
```

- **Default Behavior**: If you do not override `explainStream`, it falls back to calling `explain(issue, opts)` and yields the complete `markdown` string as a single chunk.
- **Custom Streaming**: If your AI service supports streaming responses (such as Server-Sent Events or token streaming), you can override `async *explainStream(issue, opts)` in your provider to yield markdown chunks incrementally as tokens arrive.
- **Current Route Status**: The endpoint `POST /api/explain/stream` in [`server/routes/explainStream.js`](file:///server/routes/explainStream.js) is currently a placeholder returning status 501. The generator interface in `AIProvider` is ready for streaming once server-side SSE handling is enabled.

### 5. `NotImplementedError`

If a provider or an optional capability is not yet ready, throw `NotImplementedError` from [`server/ai/provider.js`](file:///server/ai/provider.js). The Express router in [`server/routes/explain.js`](file:///server/routes/explain.js) catches this error and automatically responds with HTTP status 501 (Not Implemented).

---

## Status of Registered Providers

In [`server/ai/index.js`](file:///server/ai/index.js), four provider names are currently registered:

| Provider Name | Implementation File | Status | Notes |
|---|---|---|---|
| `mock` | [`server/ai/mock.js`](file:///server/ai/mock.js) | **Implemented** | Default provider. Template-based, works offline, no network calls, requires zero API keys. |
| `gemini` | [`server/ai/gemini.js`](file:///server/ai/gemini.js) | **Stub (Not implemented)** | Registered placeholder that throws `NotImplementedError`. |
| `groq` | [`server/ai/groq.js`](file:///server/ai/groq.js) | **Stub (Not implemented)** | Registered placeholder that throws `NotImplementedError`. |
| `ollama` | [`server/ai/ollama.js`](file:///server/ai/ollama.js) | **Stub (Not implemented)** | Registered placeholder that throws `NotImplementedError`. |

> [!IMPORTANT]
> `mock` is currently the only fully implemented provider in the codebase.
> `gemini`, `groq`, and `ollama` are stub files intended for contributors to implement. Do not assume or document them as complete until their implementation code and tests are added.

---

## How Provider Selection Works

Provider selection is resolved at server startup in [`server/ai/index.js`](file:///server/ai/index.js):

1. **Environment Configuration**: [`server/config.js`](file:///server/config.js) reads `process.env.AI_PROVIDER` (defaulting to `'mock'`) and normalizes it to lowercase:
   ```javascript
   aiProvider: (process.env.AI_PROVIDER || 'mock').toLowerCase(),
   ```
2. **Provider Registry**: [`server/ai/index.js`](file:///server/ai/index.js) maps registered provider names to their respective classes:
   ```javascript
   const providers = {
     mock: MockAIProvider,
     gemini: GeminiProvider,
     groq: GroqProvider,
     ollama: OllamaProvider,
   };
   ```
3. **Lookup & Validation**:
   ```javascript
   const Provider = providers[config.aiProvider];
   if (!Provider) {
     throw new Error(`Unknown AI_PROVIDER "${config.aiProvider}". Use: ${Object.keys(providers).join(', ')}`);
   }
   export default new Provider();
   ```
   If an invalid provider name is passed in `AI_PROVIDER`, the server crashes on boot with a helpful error message listing valid options.
4. **Route Dispatch**: [`server/routes/explain.js`](file:///server/routes/explain.js) imports the default singleton instance (`ai`) and invokes `ai.explain(issue, { context })`.

---

## Environment Variables and Configuration

All configuration is loaded on the server via `dotenv` in [`server/config.js`](file:///server/config.js) from the `.env` file at the repository root.

### Core Variables

- `AI_PROVIDER`: Name of the active provider (`mock`, `gemini`, `groq`, `ollama`, or a newly added provider). Defaults to `mock`.

### Existing Provider Variables

- `GEMINI_API_KEY`: API key for Gemini.
- `GROQ_API_KEY`: API key for Groq.
- `OLLAMA_URL`: URL for the local Ollama daemon (defaults to `http://localhost:11434`).

### Adding Variables for a New Provider

When adding a provider that requires credentials (e.g., `MY_PROVIDER_API_KEY`):

1. Add the variable to [`server/config.js`](file:///server/config.js):
   ```javascript
   export const config = {
     // ...
     myProviderApiKey: process.env.MY_PROVIDER_API_KEY || '',
   };
   ```
2. Add a commented placeholder in [`.env.example`](file:///.env.example):
   ```bash
   MY_PROVIDER_API_KEY=
   ```
3. Add your actual key to your local `.env` file:
   ```bash
   MY_PROVIDER_API_KEY=your_secret_key_here
   ```

---

## Security: Never Expose API Keys to the Browser

Open Source Buddy enforces a strict server-proxy model to protect third-party credentials:

```
[Browser / Client (React + Vite)]
          │
          │ POST /api/explain (No API keys sent)
          ▼
[Server (Express + Node.js)]  <─── Reads .env via server/config.js
          │
          │ Calls AI API with secret key (e.g., Authorization: Bearer <KEY>)
          ▼
[AI Service (Gemini, Groq, OpenAI, etc.)]
```

### Security Rules for Contributors

1. **Keep Keys on the Server**: Never import or reference AI client SDKs or API keys in `client/`. All calls to external AI APIs must be made from `server/ai/`.
2. **Do Not Use `VITE_` Prefix for Secrets**: Vite exposes any environment variable starting with `VITE_` directly to client-side bundles. Never name an API key `VITE_AI_KEY` or `VITE_GEMINI_API_KEY`.
3. **Never Return Credentials in API Responses**: The explain route should only return `{ provider, markdown, plan }`. Do not attach configuration, authorization headers, or raw client objects to JSON responses.
4. **Never Commit Secrets**: Root `.env` is listed in `.gitignore`. Only commit template variables with empty values to `.env.example`.

---

## How to Test a Provider with the Mock Setup

You can test a new or updated provider locally without needing live GitHub tokens or external internet access for issue data.

### 1. Test Against Mock GitHub Issues

Open Source Buddy provides built-in mock GitHub issue data in [`server/github/mockData/issues.json`](file:///server/github/mockData/issues.json).

To use your AI provider with mock GitHub issues, edit `.env`:

```bash
GITHUB_MODE=mock
AI_PROVIDER=myprovider
MY_PROVIDER_API_KEY=your_key
```

- `GITHUB_MODE=mock` supplies local mock issues offline.
- `AI_PROVIDER=myprovider` directs the backend to use your AI provider to explain them.

### 2. Verify in the Browser

Start both server and client:

```bash
npm run dev
```

1. Open `http://localhost:5173`.
2. Click on any issue in the list to open the detail view.
3. Click **Explain this issue**.
4. Check the result:
   - The badge should read `AI provider: myprovider`.
   - The markdown explanation should render clearly.
   - The action plan steps should appear.

### 3. Verify via HTTP Request

You can test the backend route directly using `curl` or PowerShell without opening the browser:

```bash
curl -X POST http://localhost:3001/api/explain \
  -H "Content-Type: application/json" \
  -d '{
    "issue": {
      "title": "Add dark mode toggle",
      "body": "Need a button in the header to switch themes.",
      "labels": ["good first issue", "ui"],
      "repo": "example/project",
      "language": "JavaScript"
    }
  }'
```

Expected JSON response:

```json
{
  "provider": "myprovider",
  "markdown": "# Explaining: Add dark mode toggle\n\n...",
  "plan": [
    "Fork and clone example/project.",
    "Inspect the header component in src/.",
    "Implement theme state toggle.",
    "Submit a pull request."
  ]
}
```

### 4. Direct Node Execution Test

You can also run a quick smoke test from the command line without starting the web server:

```bash
node -e "
  import('./server/ai/myprovider.js').then(async ({ MyProvider }) => {
    const provider = new MyProvider();
    const result = await provider.explain({
      title: 'Smoke Test',
      body: 'Verify provider output',
      labels: ['test'],
      repo: 'test/repo',
      language: 'JavaScript'
    });
    console.log('Provider:', provider.name);
    console.log('Markdown length:', result.markdown.length);
    console.log('Plan steps:', result.plan.length);
  });
"
```

---

## Step-by-Step Example Provider

Here is an example demonstrating how to implement a new provider (e.g. an OpenAI-compatible provider) from scratch.

### Step 1: Create the Provider Class

Create `server/ai/openai.js`:

```javascript
import { AIProvider } from './provider.js';
import { config } from '../config.js';

export class OpenAIProvider extends AIProvider {
  get name() {
    return 'openai';
  }

  async explain(issue, { context } = {}) {
    if (!config.openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured in .env');
    }

    const prompt = this.buildPrompt(issue, context);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a friendly open-source mentor. Explain the issue in plain English and provide a step-by-step starting plan. Return your answer as a JSON object with keys "markdown" (string) and "plan" (array of strings).',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    return {
      markdown: parsed.markdown || 'No explanation generated.',
      plan: Array.isArray(parsed.plan) ? parsed.plan : [],
    };
  }

  buildPrompt(issue, context) {
    const labels = (issue.labels || []).join(', ') || 'none';
    let prompt = `Repo: ${issue.repo}\nTitle: ${issue.title}\nLanguage: ${issue.language || 'unknown'}\nLabels: ${labels}\n\nIssue Body:\n${issue.body || 'No description provided.'}`;

    if (context) {
      prompt += `\n\nExtra Repository Context:\n${context}`;
    }

    return prompt;
  }
}
```

### Step 2: Add Configuration in `server/config.js`

In [`server/config.js`](file:///server/config.js), add the new API key property:

```javascript
export const config = {
  port: Number(process.env.PORT) || 3001,
  githubMode: (process.env.GITHUB_MODE || 'mock').toLowerCase(),
  githubToken: process.env.GITHUB_TOKEN || '',
  aiProvider: (process.env.AI_PROVIDER || 'mock').toLowerCase(),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  openaiApiKey: process.env.OPENAI_API_KEY || '', // <-- Added
  perPage: 6,
  dataDir: path.join(__dirname, 'data'),
};
```

### Step 3: Register Provider in `server/ai/index.js`

In [`server/ai/index.js`](file:///server/ai/index.js), import your class and add it to the `providers` map:

```javascript
import { config } from '../config.js';
import { MockAIProvider } from './mock.js';
import { GeminiProvider } from './gemini.js';
import { GroqProvider } from './groq.js';
import { OllamaProvider } from './ollama.js';
import { OpenAIProvider } from './openai.js'; // <-- Added

const providers = {
  mock: MockAIProvider,
  gemini: GeminiProvider,
  groq: GroqProvider,
  ollama: OllamaProvider,
  openai: OpenAIProvider, // <-- Added
};

const Provider = providers[config.aiProvider];
if (!Provider) {
  throw new Error(`Unknown AI_PROVIDER "${config.aiProvider}". Use: ${Object.keys(providers).join(', ')}`);
}

export default new Provider();
```

### Step 4: Update `.env.example`

In [`.env.example`](file:///.env.example), update the comment and add the variable:

```bash
# mock | gemini | groq | ollama | openai   (only mock is implemented by default)
AI_PROVIDER=mock
GEMINI_API_KEY=
GROQ_API_KEY=
OLLAMA_URL=http://localhost:11434
OPENAI_API_KEY=
```

### Step 5: Test Locally

In your local `.env`:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
GITHUB_MODE=mock
```

Run `npm run dev` and click **Explain this issue** on any card to test your integration.

---

## Contributor Checklist

Before opening a pull request with a new or completed AI provider:

- [ ] Extends `AIProvider` from [`server/ai/provider.js`](file:///server/ai/provider.js).
- [ ] Defines the getter `get name()`.
- [ ] Implements `async explain(issue, opts)` and returns `{ markdown: string, plan: string[] }`.
- [ ] Handles missing API keys or connectivity errors with clear error messages.
- [ ] Registered in `providers` in [`server/ai/index.js`](file:///server/ai/index.js).
- [ ] Environment variables defined in [`server/config.js`](file:///server/config.js) and documented in [`.env.example`](file:///.env.example).
- [ ] No API keys or external AI SDKs imported into `client/`.
- [ ] Tested locally with `GITHUB_MODE=mock` and verified via `npm run dev` or `curl`.

