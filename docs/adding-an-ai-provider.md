# Adding a New AI Provider

Open Source Buddy uses a pluggable AI provider architecture defined in `server/ai/provider.js`. This guide explains how to implement and register a new AI explanation provider.

---

## The Provider Interface

Every AI provider must export an object or instance implementing the following contract:

```javascript
export interface AIProvider {
  /** Provider identifier matching AI_PROVIDER in .env */
  name: string;

  /**
   * Generates a plain-English explanation and action plan for an issue.
   * @param issue The issue object (title, body, url, repository, labels)
   * @param opts Optional parameters (rag context, model name)
   * @returns {Promise<{ markdown: string, plan: string[] }>}
   */
  explain(issue, opts): Promise<{ markdown: string, plan: string[] }>;

  /** Optional: Stream generated text in real time */
  explainStream?(issue, onChunk, opts): Promise<void>;
}
```

---

## Step-by-Step Implementation Example

### 1. Create the Provider File
Create `server/ai/myprovider.js`:

```javascript
import { config } from '../config.js';

export const myProvider = {
  name: 'myprovider',

  async explain(issue, opts = {}) {
    const apiKey = process.env.MY_PROVIDER_API_KEY;
    if (!apiKey) {
      throw new Error('MY_PROVIDER_API_KEY is not configured in .env');
    }

    const prompt = `
You are an expert open-source mentor. Analyze this issue:
Title: ${issue.title}
Body: ${issue.body}
Repo Context: ${opts.context || 'None provided'}

Provide a markdown summary and a step-by-step action plan.
`;

    const response = await fetch('https://api.myprovider.com/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      throw new Error(`Provider error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      markdown: data.summary,
      plan: data.steps || ['Fork the repository', 'Implement changes', 'Submit PR']
    };
  }
};
```

### 2. Register in `server/ai/index.js`

Import your provider and register it in the provider map:

```javascript
import { myProvider } from './myprovider.js';

const providers = {
  mock,
  gemini,
  ollama,
  groq,
  myprovider: myProvider
};
```

### 3. Update Environment Configuration

Add the provider key to `.env.example`:

```env
# My Provider
AI_PROVIDER=myprovider
MY_PROVIDER_API_KEY=
```

---

## Security Best Practices

1. **Server-Side Only**: Never import or pass API keys to client-side code (`client/src/`).
2. **Handle Failures Gracefully**: Throw descriptive errors that the API can safely translate into user-friendly messages.
3. **Mock Compatibility**: Ensure mock mode continues to operate without requiring your provider's API key.
