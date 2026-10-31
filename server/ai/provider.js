// Common interface every AI provider implements. See docs/adding-an-ai-provider.md
// for provider registration, configuration, and testing instructions.
//
// Providers must expose a string `name` and implement:
//   explain(issue, opts) -> { markdown: string, plan: string[] }
//
// `issue` has: title, body, labels (string[]), repo, language, topics.
// `opts.context` is optional extra text (for example the repo's README).
// Providers may override explainStream(issue, opts) to yield markdown chunks.
// The default implementation yields the complete explain() markdown once.
export class AIProvider {
  get name() {
    throw new Error('Provider must define a name');
  }

  async explain() {
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
