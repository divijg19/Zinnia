# `Zinnia`

Unified, self-hosted GitHub profile cards: stats, top languages, contribution streak, trophies, and LeetCode — one TypeScript monorepo, one deploy surface.

> **Runtime:** Node.js 24 LTS (`package.json` engines) + Bun 1.3.14 (`packageManager`). Live at `zinnia-rho.vercel.app`.

## Quickstart

```sh
bun install --frozen-lockfile   # deps (CI-identical)
bun run build                   # 5 parallel tsup shards (see Build)
bun run demo:build              # prerender demo assets for all 96 themes
bun run test                    # rebuilds first (pretest), then vitest
bun run lint                    # biome --error-on-warnings + tsc --noEmit
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
| `/api/health` | health SVG | built-in |

Stats and top-langs share the `createCardHandler` wrapper (`lib/card-handler.ts`). There is no `/api/github` route.

## Embeds

```md
![stats](https://zinnia-rho.vercel.app/api/stats?username=divijg19&theme=watchdog&cache=86400)
![top-langs](https://zinnia-rho.vercel.app/api/top-langs?username=divijg19&layout=compact&cache=86400)
![streak](https://zinnia-rho.vercel.app/api/streak?username=divijg19&theme=watchdog)
![trophy](https://zinnia-rho.vercel.app/api/trophy?username=divijg19&theme=watchdog)
![leetcode](https://zinnia-rho.vercel.app/api/leetcode?username=divijg19&theme=watchdog)
```

## Response contract

Every card route keeps the same promise, enforced by `lib/canonical/http_cache.ts` and covered by `tests/api/etag_contract.test.ts`:

- **Always HTTP 200** with a renderable SVG body — never a bare 304 or an empty response. On upstream failure you get a fallback/error SVG, still 200.
- **`ETag` always set** (`Content-Type: image/svg+xml`, `X-Content-Type-Options: nosniff`, `Vary: Accept-Encoding`).
- **`?debug=1`** returns JSON diagnostics instead (`sendDebugJson`): validation stage, PAT presence (never values), fetch/render timings.
- **Error SVGs carry machine-readable codes** as `<!-- ZINNIA_ERR:CODE -->` (e.g. `STATS_RATE_LIMIT`, `TROPHY_INTERNAL`, `UNKNOWN`). See `ErrorCode` in `lib/errors.ts` for the full list.

## Cache

`?cache=` (seconds) wins, then the service override, then the global fallback:

```
?cache= → STATS_CACHE_SECONDS / TOP_LANGS_CACHE_SECONDS / STREAK_CACHE_SECONDS
        / TROPHY_CACHE_SECONDS / LEETCODE_CACHE_SECONDS (+ GITHUB_/HEALTH_)
        → CACHE_SECONDS → 86400 (health: 60)
```

`?cache=` is clamped to `0–604800` (a `0`/unparseable value falls back to the base). Error/fallback responses use short/transient caching (`Cache-Control: no-store` on debug JSON, minimum 60s on fallbacks).

## Env vars

Full matrix with defaults lives in `.env.example`. The short version:

| Group | Vars |
| ----- | ---- |
| Tokens | `PAT_1`…`PAT_5` (or a single `GITHUB_TOKEN` seed) |
| KV | `UPSTASH_REST_URL` + `UPSTASH_REST_TOKEN` (or `UPSTASH_PREFIX` variants), `PAT_STORE_NAMESPACE`, `REDIS_URL` |
| Cache TTLs | `CACHE_SECONDS` + 7 service overrides (see above) |
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

`PAT_1` is auto-seeded from `GITHUB_TOKEN` (or `GH_TOKEN`/`PAT`/…) and from `Authorization`/`x-github-token` request headers (`lib/env.ts`, `seedServicePat`). Exhausted tokens are skipped: rate-limited keys for 60s, auth failures for 300s (`RATE_LIMIT_TTL_SECONDS` / `AUTH_FAILURE_TTL_SECONDS`), persisted to KV when configured. Timeouts fail fast into the error SVG — tokens are never retried within one request.

## Themes

96 themes live in `lib/themes/registry.ts` (with per-widget `streak`/`trophy`/`leetcode` overrides), adapted by `lib/themes/adapters/`. Preview them all in the local demo (`bun run demo:dev`) — there are no static theme tables to go stale.

## Build & deploy

`bun run build` runs 5 `tsup` shards in parallel (`scripts/build-shards.sh`): leetcode core → `leetcode/packages/core/dist`, trophy renderer → `api/_build/trophy`, streak → `streak/dist` **and** minified sharp-external `api/_build/streak`, stats → `stats/api`. Vercel builds `bun run build && bun run demo:build` (`vercel.json`) and ships the bundles via `includeFiles`. Deploy: `bun run vercel:deploy` (needs `VERCEL_TOKEN`).

`lib/` owns the shared architecture: `canonical/http_cache.ts` (responses, cache, ETags), `errors.ts`, `params.ts`, `tokens.ts`, `card-handler.ts`, `fetch-timeout.ts`, `kv/upstash.ts`, `themes/`.

## Tests

`vitest.config.ts` runs `tests/**` + `leetcode/test/**`: `tests/api` (route contracts), `tests/stats|streak|trophy|lib` (units + parity vs legacy fixtures), `tests/demo` + `tests/smoke` (offline handler smoke), `tests/lib/themes` (exact adapter parity). Shared doubles live in `tests/_testShim.ts` (`makeReq`/`makeRes`, PAT env, fetch mocks, loader/retryer factories). Live-network tests (e.g. the leetcode generator test) hit real endpoints and can flake in sandboxes — re-run in isolation before trusting a failure.

## FAQ

**Streak doesn't match my contribution graph?** Stats are computed in UTC and cached — allow a few hours after pushing. Enable *Private contributions* in your GitHub profile settings to include private repos.

**Something renders wrong?** Append `?debug=1` to any card URL for the JSON diagnostic (validation, PAT presence, timings) instead of guessing.

## More docs

- `CONTRIBUTING.md` / `SECURITY.md` — how to contribute, how to report issues.
- `stats|streak|trophy|leetcode/README.md` — per-package route/param notes.
- `stats|streak|trophy|leetcode/UPSTREAM.md` — vendoring provenance and sync policy.
