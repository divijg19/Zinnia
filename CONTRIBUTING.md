# Contribution Guide

## Environment

- Node.js 24.x (`package.json` engines) and Bun 1.3.14 (`packageManager`)
- [Vercel](https://vercel.com/) for local dev and deploy
- GitHub API, with per-service PAT rotation across `PAT_1` through `PAT_5`

## Local run

Copy `.env.example` to `.env` and set at least `PAT_1` (or `GITHUB_TOKEN`):

```sh
bun install --frozen-lockfile
bun run build
bunx vercel dev
```

Then open `http://localhost:3000/api/stats?username=divijg19`. For the theme gallery, run `bun run demo:dev`.

## Build

`bun run build` runs five `tsup` shards concurrently via `scripts/build-shards.sh`:

| Entry point | Output |
| ----------- | ------ |
| `leetcode/packages/core/src/index.ts` | `leetcode/packages/core/dist` |
| `trophy/src/renderer.ts` | `api/_build/trophy` |
| `streak/src/index.ts` | `streak/dist` |
| `streak/src/index.ts` (minified, `sharp` external) | `api/_build/streak` |
| `stats/src/index.ts` | `stats/api` |

Vercel runs `bun run build && bun run demo:build` and ships the bundles through `includeFiles` in `vercel.json`. To deploy by hand, set `VERCEL_TOKEN` and run `bun run vercel:deploy`.

`bun run demo:build` prerenders every theme into `demo/assets/` and regenerates `demo/theme-registry.json`. It is deterministic: CI builds twice and diffs the checksums.

## Tests

`vitest.config.ts` collects `tests/**` and `leetcode/test/**`:

| Path | Contents |
| ---- | -------- |
| `tests/api` | route contracts, cache and ETag behaviour |
| `tests/stats`, `tests/streak`, `tests/trophy` | units plus parity against the legacy fixtures |
| `tests/lib` | shared library, including exact theme-adapter parity |
| `tests/demo`, `tests/smoke` | demo asset smoke test and offline handler smoke test |

Shared test doubles live in `tests/_testShim.ts`: request and response shims, PAT env save and restore, fetch mocks, and the loader and retryer mock factories. Extend it instead of writing local mocks.

`bun run test` builds first (the `pretest` hook) and then runs vitest. A few tests reach the live network, such as the leetcode generator test; those can fail in a sandbox, so re-run one in isolation before believing it.

## House rules

- One commit and one PR per change, covering a single concern in as few lines as possible. Open an issue before starting core work.
- Reliability comes first. No aggressive retries, no unbounded work, and no request path that can hang; every outbound fetch has a timeout.
- Show the checks. Before opening a PR, `bun run lint`, `bun run build`, and the full `bun run test` must pass. Run the targeted suites first and the full suite last.
- Do not add vendored boilerplate. Per-package documentation stays a short stub, and generated or canonical sources such as `lib/themes/registry.ts` and `.env.example` take precedence over hand-maintained tables.

## Pull requests

Keep each PR to one concern and meet the bar above. For a change that affects what an embed returns, also run `bun run embed:smoke -- --base http://localhost:3000` against local dev.
