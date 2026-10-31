# Open Source Buddy

An AI-assisted web app that helps beginners **find, understand and start** their first open source contribution.

- Browse and search issues, filter by language and topic
- Check a repo's health before you invest a weekend (last merged PR, maintainer response time, CONTRIBUTING.md)
- Press **Explain this issue** to get a plain-English summary, likely files and a starting plan
- Save issues for later, switch between light and dark themes

This repo is the starter project for the **Hacktoberfest Hack Day at NIT Jamshedpur**. See [CONTRIBUTING.md](CONTRIBUTING.md) to take part.

## Run it

You need **Node.js 20 or newer** (works on Windows, macOS and Linux). No database and no API keys are needed.

```bash
git clone <your-fork-url>
cd open-source-buddy
npm install
npm run dev
```

Then open http://localhost:5173. `npm run dev` starts the Express API (port 3001) and the Vite client (port 5173) together.

## Mock mode vs live mode

| | Mock (default) | Live |
|---|---|---|
| GitHub data | Local sample JSON in `server/github/mockData/` | Real GitHub REST API |
| Needs internet | No | Yes |
| UI hint | Yellow **Sample data** banner | No banner |

To change modes, copy `.env.example` to `.env` and edit it:

```bash
cp .env.example .env      # on Windows: copy .env.example .env
```

- `GITHUB_MODE=live` uses the real GitHub API. It works without a token (60 requests/hour). Add `GITHUB_TOKEN` for more.
- `AI_PROVIDER=mock` is the only AI provider that is implemented. It builds the explanation from the issue's own title, labels and body.

Keys and tokens live only in the server's `.env` file. They are never sent to the browser.

## Optional GitHub sign-in

Saved issues work without signing in and are scoped to a browser using an HTTP-only cookie. Signed-in users get a separate saved-issue list associated with their GitHub account. Existing issues in the old shared anonymous bucket are not copied to accounts.

To enable sign-in, create a GitHub OAuth App and set these values in the root `.env`:

```env
GITHUB_OAUTH_CLIENT_ID=<your-client-id>
GITHUB_OAUTH_CLIENT_SECRET=<your-client-secret>
GITHUB_OAUTH_CALLBACK_URL=http://localhost:3001/api/auth/github/callback
APP_URL=http://localhost:5173
```

Set the OAuth App's authorization callback URL to the same value as `GITHUB_OAUTH_CALLBACK_URL`. Keep the client secret only in `.env`; the server exchanges the OAuth code and does not send or store the GitHub access token. In production, set `GITHUB_OAUTH_CALLBACK_URL` and `APP_URL` to your HTTPS URLs; secure cookies are enabled automatically when `NODE_ENV=production`.

Sessions expire after seven days and are held in server memory, so restarting the server requires users to sign in again. If OAuth is not configured, saved issues remain available anonymously in the current browser.

## Project structure

```
open-source-buddy/
├── client/                  React + Vite frontend
│   └── src/
│       ├── App.jsx          page layout and shared state
│       ├── api.js           all calls to the backend
│       ├── components/      cards, filters, detail panel, sidebar ...
│       ├── hooks/           data and theme hooks
│       ├── styles/          CSS files
│       └── utils/           small helpers
├── server/                  Node.js + Express backend
│   ├── index.js             app entry point
│   ├── config.js            reads .env
│   ├── routes/              /api/auth, /api/issues, /api/repos, /api/explain, /api/saved
│   ├── ai/                  AI provider interface + mock (Gemini, Groq, Ollama are stubs)
│   ├── github/              GitHub provider interface + mock + live
│   ├── lib/                 filtering, pagination, health score, saved-issue storage
│   ├── auth/                who is the current user
│   ├── middleware/          Express middleware
│   └── data/saved.json     saved issues (created automatically, git-ignored)
├── .github/                 pull request template
├── CONTRIBUTING.md
└── .env.example
```

## API

| Method | Path | Description |
|---|---|---|
| GET | `/api/issues` | List issues. Query: `q`, `language`, `topic`, `sort`, `page` |
| GET | `/api/repos/:owner/:name/health` | Repo health metrics and score |
| POST | `/api/explain` | Body `{ "issue": {...} }`, returns the AI explanation |
| GET / POST / DELETE | `/api/saved` | List, add (`POST`) or remove (`DELETE /api/saved/:id`) saved issues |
| GET | `/api/auth/github` | Start GitHub OAuth sign-in |
| GET | `/api/auth/github/callback` | Handle GitHub's OAuth callback |
| GET | `/api/auth/me` | Get the current signed-in user and auth status |
| POST | `/api/auth/logout` | Sign out and clear the session |

## License

[MIT](LICENSE)
