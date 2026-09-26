# `Zinnia`

Unified, self-hosted GitHub profile cards: stats, top languages, contribution streak, trophies, and LeetCode. One TypeScript monorepo, one deploy surface.

> **Runtime:** Node.js 24 LTS (`package.json` engines) + Bun 1.3.14 (`packageManager`). Live at `zinnia-rho.vercel.app`.

## Getting started

```sh
bun install --frozen-lockfile   # dependencies
bun run build                   # bundles, see CONTRIBUTING.md
bun run demo:build              # prerender demo assets for all 96 themes
bun run test                    # rebuilds, then runs vitest
bun run lint                    # biome + tsc
```

Targeted suites: `bun run test:api`, `test:stats`, `test:demo`, `test:leetcode`. Type-check only: `bun run type-check`. Format: `bun run format`.

## Routes

All handlers live in `api/*.ts` (Vercel rewrites `/(.*)` → `/api/$1`):

| Route | Handler | Source |
| ----- | ------- | ------ |
| `/api/stats?username=…` | stats card | `stats/src/fetchers/stats.ts` + `stats/src/cards/stats.ts` |
| `/api/top-langs?username=…` | top-languages card | `stats/src/fetchers/top-languages.ts` + `stats/src/cards/top-languages.ts` |
| `/api/streak?username=…` (`user=` also works) | contribution streak | `streak/src/fetcher.ts` + `streak/src/card.ts` |
| `/api/trophy?username=…` | profile trophies | `trophy/src/Services/` + `trophy/src/renderer.ts` |
| `/api/leetcode?username=…` | LeetCode stats | `leetcode/packages/core/src/` |
| `/api/health` | health **SVG** card (`?text=` custom label) | `api/health.ts` |
| `/api/__health` | health **JSON** readiness probe (`{"ok":true}` + `X-Ready: 1`) | `api/__health.ts` |

Stats and top-langs share the `createCardHandler` wrapper (`lib/card-handler.ts`). There is no `/api/github` route.

There are two health endpoints. `/api/health` returns an SVG card, so it can be embedded directly in a README; it accepts `?text=` and `?cache=` and defaults to a 60s TTL. `/api/__health` is a machine probe: a JSON body and an `X-Ready` header, with no rendering and no cache headers.

## Response contract

Every card route follows the same contract. It is implemented in `lib/canonical/http_cache.js` and covered by `tests/api/etag_contract.test.ts`.

- Responses are always HTTP 200 with a renderable SVG body. A bare 304 or an empty body is never sent. When an upstream call fails, the response is still a 200 carrying a fallback or error card.
- Every response sets an `ETag`, plus `Content-Type: image/svg+xml`, `X-Content-Type-Options: nosniff`, and `Vary: Accept-Encoding`.
- Adding `?debug=1` returns JSON diagnostics instead of an image: the validation stage, whether a PAT is present (never its value), and fetch and render timings.
- Error cards carry a machine-readable code in a trailing comment, `<!-- ZINNIA_ERR:CODE -->`, for example `STATS_RATE_LIMIT`, `TROPHY_INTERNAL`, or `UNKNOWN`. `ErrorCode` in `lib/errors.ts` lists them all.

## Cache

`?cache=` (seconds) wins, then the service override, then the global fallback:

```
?cache= → STATS_CACHE_SECONDS / TOP_LANGS_CACHE_SECONDS / STREAK_CACHE_SECONDS
        / TROPHY_CACHE_SECONDS / LEETCODE_CACHE_SECONDS / HEALTH_CACHE_SECONDS
        → CACHE_SECONDS → 86400 (health: 60)
```

`?cache=` is clamped to `0–604800` (a `0`/unparseable value falls back to the base). Error/fallback responses use short/transient caching (`Cache-Control: no-store` on debug JSON, minimum 60s on fallbacks).

## Env vars

Full matrix with defaults lives in `.env.example`. The short version:

| Group | Vars |
| ----- | ---- |
| Tokens | `PAT_1` through `PAT_5`, or a single `GITHUB_TOKEN` seed |
| KV | `UPSTASH_REST_URL` + `UPSTASH_REST_TOKEN` (or `UPSTASH_PREFIX` variants), `PAT_STORE_NAMESPACE`, `REDIS_URL` |
| Cache TTLs | `CACHE_SECONDS` + 6 service overrides (see above) |
| Timeouts | `STATS_GRAPHQL_TIMEOUT_MS`, `STATS_REST_TIMEOUT_MS`, `STREAK_FETCH_TIMEOUT_MS`, `TROPHY_GRAPHQL_TIMEOUT_MS`, `LEETCODE_GRAPHQL_TIMEOUT_MS` (default 8000ms; KV fixed at 5000ms) |
| File cache | `CACHE_DIR`, `TROPHY_CACHE_DIR`, `STREAK_CACHE_DIR` (best-effort, off unless set) |

## Auth / PAT rotation

Each service prefers its own token and falls back to global rotation (`SERVICE_PAT_MAP` in `lib/tokens.ts`):

| Service | Preferred |
| ------- | --------- |
| stats, top-langs | `PAT_1` |
| leetcode | `PAT_2` |
| trophy | `PAT_3` |
| streak | `PAT_4` |

`PAT_1` is seeded automatically from `GITHUB_TOKEN` and the other common aliases, and from `Authorization` or `x-github-token` request headers. See `lib/env.ts` and `seedServicePat`.

Exhausted tokens are skipped. A rate-limited key is set aside for 60s and an auth failure for 300s; both windows are hardcoded in `stats/src/common/retryer.ts` rather than configurable. Stats, top-langs, and streak mark exhaustion; the trophy and leetcode routes do not, so a key that rate-limits those two is retried on the next request. Exhaustion state is persisted to KV when a store is configured. A fetch timeout returns the error card immediately; tokens are never retried within the same request.

## Themes

96 themes live in `lib/themes/registry.ts`, each with optional per-widget `streak`, `trophy`, and `leetcode` overrides. `lib/themes/adapters/` turns them into each card's option set. Run `bun run demo:dev` to preview all of them; there is no static theme table to keep in sync.

## FAQ

**Streak doesn't match my contribution graph?** Stats are computed in UTC and cached, so allow a few hours after pushing. Enable *Private contributions* in your GitHub profile settings to include private repos.

**Something renders wrong?** Add `?debug=1` to any card URL for a JSON diagnostic covering validation, PAT presence, and timings.

## Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md) - local setup, build, tests, code conventions
- [SECURITY.md](SECURITY.md) - reporting a vulnerability
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) - expectations for contributors
- [.env.example](.env.example) - every environment variable, grouped and annotated

Per package:

- [stats/README.md](stats/README.md) - `/api/stats`, `/api/top-langs`
- [streak/README.md](streak/README.md) - `/api/streak`
- [trophy/README.md](trophy/README.md) - `/api/trophy`
- [leetcode/README.md](leetcode/README.md) - `/api/leetcode`

Provenance, for anyone re-syncing a vendored upstream:

- [stats/UPSTREAM.md](stats/UPSTREAM.md)
- [streak/UPSTREAM.md](streak/UPSTREAM.md)
- [trophy/UPSTREAM.md](trophy/UPSTREAM.md)
- [leetcode/UPSTREAM.md](leetcode/UPSTREAM.md)
