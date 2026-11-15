# Deployment and runtimes

## Two runtimes, with a line between them

|           | Runtime     | What it runs                                                                  |
| --------- | ----------- | ----------------------------------------------------------------------------- |
| Toolchain | **Bun**     | `bun install`, `bun build` (the five shards), the scripts, the demo generator |
| Runtime   | **Node 26** | the deployed Vercel functions, and the process vitest runs in                 |

`engines.node` is `26.x`, which is what Vercel deploys with, and every CI job
runs the same major - the workflow defines it once as `NODE_VERSION`, and a
guard step fails the build when the runtime under test is not the one in
`engines.node`. A Node major is a deployment contract, so it does not float.

Bun does float: CI installs the current release, and `bun.lock` is what pins
the dependency graph.

Vitest runs on Node. Running it under Bun (`bun --bun`) is not an option: it
fails a float-equality assertion that Node computes exactly.

One platform limit is worth knowing: Vercel's Node runtime ships **small-ICU**
data, so every `Intl` call there resolves to `en-US`. Nothing parses locale
output as data any more, but the remaining uses are display labels, so a
non-English `?locale=` renders English labels in production.

## The build

`bun run build` runs five `bun build` shards concurrently through
`scripts/build-shards.sh`. Every shard emits ESM for Node with `--minify`,
external source maps, code splitting, and package dependencies kept external
(`--packages=external`), so runtime dependencies such as `sharp` resolve from
`node_modules` instead of being inlined:

| Entry point                           | Output                                |
| ------------------------------------- | ------------------------------------- |
| `leetcode/packages/core/src/index.ts` | `leetcode/packages/core/dist`         |
| `trophy/src/renderer.ts`              | `api/_build/trophy`                   |
| `streak/src/index.ts`                 | `streak/dist` and `api/_build/streak` |
| `stats/src/index.ts`                  | `stats/api`                           |

`streak` is built to two locations because the renderer loaders probe both;
the two bundles are byte-identical.

Vercel runs `bun run build && bun run demo:build` and ships the bundles
through `includeFiles` in `vercel.json`. To deploy by hand, set `VERCEL_TOKEN`
and run `bun run vercel:deploy`.

## The functions

Every file in `api/` becomes a Vercel function, so that directory holds
routes only. Shared modules live in `lib/`, and a file in `api/` whose name
starts with an underscore is shared code that Vercel never routes to -
`tests/api/route_reachability.test.ts` keeps that honest.

| Route                                         | Handler                                                        |
| --------------------------------------------- | -------------------------------------------------------------- |
| `/api/stats?username=…`                       | stats card                                                     |
| `/api/top-langs?username=…`                   | top-languages card                                             |
| `/api/streak?username=…` (`user=` also works) | contribution streak                                            |
| `/api/trophy?username=…`                      | profile trophies                                               |
| `/api/leetcode?username=…`                    | LeetCode stats                                                 |
| `/api/health`                                 | health **SVG** card (`?text=` custom label)                    |
| `/api/healthz` (`/api/__health` alias)        | health **JSON** readiness probe (`{"ok":true}` + `X-Ready: 1`) |

Stats and top-langs share the `createCardHandler` wrapper
(`lib/card-handler.ts`). There is no `/api/github` route.

`/api/health` returns an SVG card, so it can be embedded directly in a
README; it accepts `?text=` and `?cache=` and defaults to a 60s TTL.
`/api/healthz` is a machine probe: a JSON body and an `X-Ready` header, with
no rendering and no cache headers. `/api/__health` rewrites to
`/api/healthz`; it used to be its own file, and Vercel never routed to it
because files in `api/` whose names begin with an underscore are shared
code, not functions.

## Continuous integration

`.github/workflows/ci.yml` runs four jobs:

| Job                      | What it does                                                  |
| ------------------------ | ------------------------------------------------------------- |
| Lint and typecheck       | biome, then `tsc --noEmit`                                    |
| Build shards             | the five shards, uploaded as an artifact                      |
| Tests                    | vitest, with the build outputs from the previous job          |
| Demo build + determinism | builds the demo twice and diffs the checksums, then smokes it |
| Embed manifest           | the manifest against the profile README                       |

The `Vercel` job deploys a preview of every pull request, which is where the
deployed resolution of the `api/` tree is exercised.

## Deploying by hand

```sh
export VERCEL_TOKEN=…
bun run vercel:deploy
```
