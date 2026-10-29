# Contributing to Open Source Buddy

Welcome to the Hack Day! If this is your first open source contribution, you are in the right place.

## How it works

1. **Fork** this repository (button at the top right on GitHub).
2. **Clone** your fork and run the app (see the [README](README.md)).
3. **Pick one issue** from the Issues tab. No need to claim it: several teams can work on the same issue.
4. Create a **branch**: `git checkout -b fix/short-description`
5. Make a **small, focused change** that solves only that issue.
6. Commit and push to your fork.
7. Open a **Pull Request** to this repo. In the description write `Closes #N`, where `N` is the issue number.

## PRs are not merged

During the event we **do not merge** pull requests. Judges read and score each PR on its own, so every PR must work by itself and must not depend on someone else's PR.

## Tags and points

Every issue has exactly one tag:

| Tag | Points | Expected time |
|---|---|---|
| `documentation` | 1 | under 1 hour |
| `beginner` | 10 | under 1 hour |
| `hard` | 20 | 3 to 5 hours |

Judges look at: does it solve the issue, is the change clean and small, did you test it, is the PR description clear.

## Rules

- One issue per PR. Do not mix changes.
- Touch only the files the issue points to, unless you have a good reason.
- Do not commit `.env`, `node_modules` or secrets.
- Run `npm run dev` and try your change in the browser before you open the PR.
- Be kind. Ask questions in the issue thread.

## Stuck?

Ask a volunteer, or read the "Where to look" section of your issue.
