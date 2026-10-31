import { config } from '../config.js';
import { MockGitHubProvider } from './mock.js';
import { LiveGitHubProvider } from './live.js';
import { withCache } from './cache.js';

if (!['mock', 'live'].includes(config.githubMode)) {
  throw new Error(`Unknown GITHUB_MODE "${config.githubMode}". Use "mock" or "live".`);
}

const provider = config.githubMode === 'live' ? new LiveGitHubProvider(config.githubToken) : new MockGitHubProvider();

export default withCache(provider, { ttlMs: config.githubCacheTtlMs });
