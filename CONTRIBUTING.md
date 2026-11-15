# Contribution Guide

## Environment

- Node.js 26.x (`.node-version`, and `engines.node` in `package.json`)
- Bun, the current release - it installs the dependencies, builds the shards and runs the scripts
- [Vercel](https://vercel.com/) for local dev and deploy
- GitHub API, with per-service PAT rotation across `PAT_1` through `PAT_5`

### Runtimes

Two runtimes, with a line between them:

|           | Runtime     | What it runs                                                                  |
| --------- | ----------- | ----------------------------------------------------------------------------- |
| Toolchain | **Bun**     | `bun install`, `bun build` (the five shards), the scripts, the demo generator |
| Runtime   | **Node 26** | the deployed Vercel functions, and the process vitest runs in                 |

`bunx vitest` still runs the tests on Node, because vitest does. Running them
under Bun (`bun --bun`) is not an option: it fails a float-equality assertion
(`224.99999999999997` against `225`) that Node computes exactly.

**Node is pinned; Bun floats.** `engines.node` is `26.x`, which is what Vercel
deploys with, and every CI job runs the same major - the CI workflow defines
it once as `NODE_VERSION` and a guard step fails the build if the runtime
under test is not the one in `engines.node`. A Node major is a deployment
contract, so it does not float. Bun does float: CI installs the current
release, and `bun.lock` is what pins the dependency graph.

One platform limit worth knowing: Vercel's Node runtime is **small-ICU**, so
every `Intl` call there resolves to `en-US`. Nothing parses locale output as
data any more, but a non-English `?locale=` renders English labels in
production.

## Local run

Copy `.env.example` to `.env` and set at least `PAT_1` (or `GITHUB_TOKEN`):

```sh
bun install --frozen-lockfile
bun run build
bunx vercel dev
```

Then open `http://localhost:3000/api/stats?username=divijg19`. For the theme gallery, run `bun run demo:dev` - it builds the demo and serves it from `public/demo/`, the same output the deployment ships.

## Build

`bun run build` runs five `bun build` shards concurrently via `scripts/build-shards.sh`. Every shard emits ESM for Node with `--minify`, external source maps, code splitting, and package dependencies kept external (`--packages=external`), so runtime deps such as `sharp` and `dotenv` resolve from `node_modules` instead of being inlined:

| Entry point                           | Output                        |
| ------------------------------------- | ----------------------------- |
| `leetcode/packages/core/src/index.ts` | `leetcode/packages/core/dist` |
| `trophy/src/renderer.ts`              | `api/_build/trophy`           |
| `streak/src/index.ts`                 | `streak/dist`                 |
| `streak/src/index.ts`                 | `api/_build/streak`           |
| `stats/src/index.ts`                  | `stats/api`                   |

`streak` is built to two locations because the renderer loaders probe both; the two bundles are byte-identical.

Vercel runs `bun run build && bun run demo:build` and ships the bundles through `includeFiles` in `vercel.json`. To deploy by hand, set `VERCEL_TOKEN` and run `bun run vercel:deploy`.

`bun run demo:build` prerenders every theme into `demo/assets/`, regenerates `demo/theme-registry.json`, and bundles the demo app into `demo/app.js` - the browser loads that bundle, so it is a build artifact and is not tracked. The build publishes only what the page needs into `public/demo/`. It is deterministic: CI builds twice and diffs the checksums of the assets _and_ the bundle.

## Tests

`vitest.config.ts` collects `tests/**` and `leetcode/test/**`:

| Path                                          | Contents                                             |
| --------------------------------------------- | ---------------------------------------------------- |
| `tests/api`                                   | route contracts, cache and ETag behaviour            |
| `tests/stats`, `tests/streak`, `tests/trophy` | units plus parity against the legacy fixtures        |
| `tests/lib`                                   | shared library, including exact theme-adapter parity |
| `tests/demo`, `tests/smoke`                   | demo asset smoke test and offline handler smoke test |

Shared test doubles live in `tests/_testShim.ts`: request and response shims, PAT env save and restore, fetch mocks, and the SVG header assertions. Extend it instead of writing local mocks. The `vi.doMock` factories live in `tests/_mockHelpers.ts`, separately, because the `vi.doMock` _call_ has to stay in the test file - vitest resolves the specifier relative to the caller.

Vitest runs in the `node` environment by default. The nine suites that touch the DOM carry a `// @vitest-environment jsdom` docblock; add the same docblock to a new file that needs `document` or `window`. Building a DOM for every file cost the suite roughly 35s of worker startup, so the DOM is built only where it is used.

`bun run test` builds first (the `pretest` hook) and then runs vitest. A few tests reach the live network, such as the leetcode generator test; those can fail in a sandbox, so re-run one in isolation before believing it.

## House rules

- One commit and one PR per change, covering a single concern in as few lines as possible. Open an issue before starting core work.
- Reliability comes first. No aggressive retries, no unbounded work, and no request path that can hang; every outbound fetch has a timeout.
- Show the checks. Before opening a PR, `bun run lint`, `bun run build`, and the full `bun run test` must pass. Run the targeted suites first and the full suite last.
- Do not add vendored boilerplate. Per-package documentation stays a short stub, and generated or canonical sources such as `lib/themes/registry.ts` and `.env.example` take precedence over hand-maintained tables.

## Pull requests

Keep each PR to one concern and meet the bar above. For a change that affects what an embed returns, also run `bun run embed:smoke -- --base http://localhost:3000` against local dev.

## Documentation

The README is the front door: what the project is, how to run it, and the
routes. Everything else lives in `docs/`:

- [docs/RESPONSE-CONTRACT.md](docs/RESPONSE-CONTRACT.md) - what every card route guarantees
- [docs/CACHING.md](docs/CACHING.md) - the TTLs, the render cache and the budgets
- [docs/EMBEDS.md](docs/EMBEDS.md) - the manifest, the warmer and the smoke check
- [docs/CONFIGURATION.md](docs/CONFIGURATION.md) - the environment variables and the PAT rotation
- [docs/THEMES.md](docs/THEMES.md) - the registry, the adapters and the demo
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - the runtimes, the build and the CI
