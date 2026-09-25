# Contribution Guide

## Environment

- Node.js 24.x (`package.json` engines) + Bun 1.3.14 (`packageManager`)
- [Vercel](https://vercel.com/) for local dev and deploy
- GitHub API (per-service PAT rotation, `PAT_1..PAT_5`)

## Local run

Copy `.env.example` to `.env` and set at least `PAT_1` (or `GITHUB_TOKEN`):

```sh
bun install --frozen-lockfile
bun run build
bunx vercel dev
```

Then open `http://localhost:3000/api/stats?username=divijg19`. For the theme gallery: `bun run demo:dev`.

## House rules

- **One commit + one PR per change**, kept to a single concern in the least number of lines. Discuss core changes in an issue first.
- **Reliability first:** correctness over cleverness; no aggressive retries, no unbounded work, no hangs (every fetch has a timeout).
- **Prove it:** `bun run lint`, `bun run build`, full `bun run test` green before opening a PR. Targeted suites first (`test:api`, `test:stats`), full suite last.
- **No vendored boilerplate:** per-package docs stay as short stubs; canonical sources (`lib/themes/registry.ts`, `.env.example`) over static tables.
- Shared test doubles live in `tests/_testShim.ts` — extend them instead of rolling local mocks.

## Pull requests

Single concern, verified as above. For embed-affecting changes, also run `bun run embed:smoke -- --base http://localhost:3000` against local dev.
