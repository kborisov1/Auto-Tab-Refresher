# CLAUDE.md: Auto Tab Refresher

## Read this first
Before doing anything else (writing code, creating files, running commands), read both files in full:

- `docs/scope.md`: what the extension does, what is out of scope, behavior decisions, acceptance criteria.
- `docs/architecture.md`: how it is built, key technical decisions, permissions, known limits, test plan.

These two files are the source of truth. Follow them exactly. If something is ambiguous or missing, ask before choosing.

## Code conventions
Plain modern JavaScript (ES2022), no dependencies, no build step, no TypeScript. Use `const` and `let`, `async`/`await`, and strict equality. Use two-space indentation, double quotes, and semicolons. Keep functions small and named for what they do. Add comments only where the reason for the code is not obvious. Never use `eval`, inline scripts in HTML, or remote code. Keep CSS simple, with no frameworks.

Prefer the smallest change that satisfies the docs. Do not add features, options, or abstractions that the docs do not call for.

## Running and checking it locally
There is nothing to install or build. To try the extension, open `chrome://extensions`, enable Developer mode, click "Load unpacked", and select the project root. After every code change, click the reload icon on the extension's card. To debug the worker, click "service worker" on that card to open its DevTools console. To debug the popup, right-click the popup and choose Inspect.

Because the worker is suspended when idle, verify behavior after letting it sleep, not only right after loading. Check the console for errors before saying anything works.

## Git and GitHub
This project lives in a GitHub repository, with `main` as the default branch. Keep it simple.

First-time setup, if the repo does not exist yet:
1. Run `git init` in the project root and add a `.gitignore` containing `.DS_Store`, `*.zip`, and `.vscode/`.
2. Create an empty repository on GitHub (no README, no license, so there are no conflicts).
3. Run `git remote add origin <repo-url>`, then `git branch -M main`, then `git push -u origin main`.

Day-to-day workflow:
1. Run `git status` and `git pull` before starting.
2. Make one focused change at a time, and commit it with a short imperative message (for example "Add alarm cleanup on tab close"). Commit working states only.
3. Do small work directly on `main`. For anything bigger or risky, use a branch (`git switch -c feature-name`), push it, open a pull request, and ask for review by user when it works.
4. Never commit secrets or personal data. None are needed for this project.

Do not run `git push`, force-push, rewrite history, or delete branches unless the owner asks.

## Definition of done
A task is done when it matches the docs, the extension loads in Chrome without errors in the extension card or the worker console, and the relevant checks from the test plan in `docs/architecture.md` pass. Tell the owner which checks you ran and which ones only they can run by hand (for example the multi-hour background test). Do not claim a check passed if it was not actually run.

## Working with the owner
The owner is the only user. Be direct and concise in explanations. Ask a clarifying question when something is unclear instead of guessing. Report what changed and what remains.
