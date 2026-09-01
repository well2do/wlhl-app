# Repository Working Agreements

- Write source code, comments, commit messages, and technical documentation in English.
- Communicate with the user in Chinese unless the user asks for another language.
- After completing and verifying any file change in this repository, create a Git commit and push the current branch to `origin` before reporting completion.
- Never commit secrets, credentials, `.env.local`, local databases, generated build output, or other ignored files.
- If committing or pushing fails, preserve the completed local changes and clearly report the failure instead of claiming the work was published.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
