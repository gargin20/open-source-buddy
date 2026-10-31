export class AIProvider {
  get name() { throw new Error('Provider must define a name'); }
  async explain() { throw new Error('Provider must implement explain()'); }
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