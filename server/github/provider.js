// Common interface every GitHub data provider implements.
//
//   listIssues({ q, language, topic })  -> Issue[]
//   getRepoHealth(owner, name)          -> { lastMergedPrDays, responseHours,
//                                            mergedPrs30d, hasContributing } | null
//   getRepoFile(owner, name, path)      -> string | null   (file text)
//
// Issue shape:
//   { id, number, title, body, repo: "owner/name", url, labels: string[],
//     language, topics: string[], comments, createdAt (ISO string),
//     updatedAt (ISO string, optional) }
export class GitHubProvider {
  get name() {
    throw new Error('Provider must define a name');
  }

  async listIssues() {
    throw new Error('Provider must implement listIssues()');
  }

  async getRepoHealth() {
    throw new Error('Provider must implement getRepoHealth()');
  }

  async getRepoFile() {
    throw new Error('Provider must implement getRepoFile()');
  }
}
