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
| `/api/healthz` (`/api/__health` alias) | health **JSON** readiness probe (`{"ok":true}` + `X-Ready: 1`) | `api/healthz.ts` |

Stats and top-langs share the `createCardHandler` wrapper (`lib/card-handler.ts`). There is no `/api/github` route.

There are two health endpoints. `/api/health` returns an SVG card, so it can be embedded directly in a README; it accepts `?text=` and `?cache=` and defaults to a 60s TTL. `/api/healthz` is a machine probe: a JSON body and an `X-Ready` header, with no rendering and no cache headers. `/api/__health` rewrites to `/api/healthz`; it used to be its own file, and Vercel never routed to it because files in `api/` whose names begin with an underscore are shared code, not functions (`tests/api/route_reachability.test.ts` keeps that honest).

## Response contract

Every card route follows the same contract. It is implemented in `lib/canonical/http_cache.js` and covered by `tests/api/etag_contract.test.ts`.

- Responses are always HTTP 200 with a renderable SVG body. A bare 304 or an empty body is never sent. When an upstream call fails, the response is still a 200 carrying the last good render, or an error card when there is nothing cached.
- No card depends on a CSS animation to become visible. Every property an animation touches already holds its final value in the element's own style, and the animation only fills `backwards`. Otherwise a reader with reduced motion, an embedder that suppresses motion, or a renderer that drops the style block gets a blank card. The same rule requires every emitted `<style>` block to be brace-balanced: a stray `}` once landed on top of a theme's `:root` rules, so the parser discarded the palette and the card rendered as a white rectangle. `tests/api/card_css_invariants.test.ts` and `embed:smoke` both enforce this.
- Every response sets an `ETag`, plus `Content-Type: image/svg+xml`, `X-Content-Type-Options: nosniff`, and `Vary: Accept-Encoding`.
- Every response reports which tier answered in `X-Cache-Status`: `hit` (served from the render cache), `miss` (rendered now), `stale` (served from the render cache because the refresh failed or overran its deadline), `fallback` (a compatibility branch, not an embeddable card), `static` (a fixed card), or `transient` (an error card).
- Adding `?debug=1` returns JSON diagnostics instead of an image, on every card route: the validation stage, whether a PAT is present (never its value), the render-cache decision, and fetch and render timings. A cache hit reports no `fetchMs`, because no fetch happened.
- Error cards carry a machine-readable code in a trailing comment, `<!-- ZINNIA_ERR:CODE -->`, for example `STATS_RATE_LIMIT`, `TROPHY_INTERNAL`, `USER_NOT_FOUND`, or `UNKNOWN`. `ErrorCode` in `lib/errors.ts` lists them all. A username that does not resolve reports `USER_NOT_FOUND` and names the username, instead of a generic internal error.

## Cache

`?cache=` (seconds) wins, then the service override, then the global fallback:

```
?cache= → STATS_CACHE_SECONDS / TOP_LANGS_CACHE_SECONDS / STREAK_CACHE_SECONDS
        / TROPHY_CACHE_SECONDS / LEETCODE_CACHE_SECONDS / HEALTH_CACHE_SECONDS
        → CACHE_SECONDS → 86400 (health: 60)
```

`?cache=` is clamped to `0–604800` (a `0`/unparseable value falls back to the base). Error/fallback responses use short/transient caching (`Cache-Control: no-store` on debug JSON, minimum 60s on fallbacks, and at most an hour on a fallback body so an out-of-date card cannot be pinned downstream).

Fresh responses carry `stale-while-revalidate` and `stale-if-error` and deliberately **not** `must-revalidate`. `must-revalidate` forbids serving stale, which cancels both of those directives; while it was present, every TTL expiry sent the first visitor back down the full cold path.

Note which cache this reaches. Vercel rewrites the client-facing `Cache-Control` - it consumes `s-maxage` and `stale-while-revalidate` and re-emits only `max-age` - so these directives govern Vercel's own edge, and Camo is handed `max-age` alone. The render cache below, not the header, is what removes the blank-embed path: it answers regardless of what any intermediary does with the headers.

### Render cache

`lib/render-cache.ts` stores rendered SVGs in process memory and, when configured, Upstash KV (`UPSTASH_REST_URL` + `UPSTASH_REST_TOKEN`). It exists so a revalidation is answered from the previous render instead of re-running the GitHub fetch, and so a fetch that fails still returns a card. GitHub Camo gives up fetching an origin image after 10s, so a miss inside that window rendered blank and only a refresh seemed to fix it; a served render does not depend on the timing at all.

Two render budgets, because they answer different questions:

| Budget | Default | Applies when | Why |
| ------ | ------- | ------------ | --- |
| `RENDER_DEADLINE_MS` | 3500ms | a previous render is cached | latency choice: at the budget a stale card can be served immediately |
| `RENDER_CEILING_MS` | 8500ms | nothing is cached | the real card is the only good answer, so an error card would be strictly worse |

The ceiling sits above the longest outbound fetch (8000ms by default), so it only fires after the upstream has already given up, and below Camo's 10s limit. A single shared budget got this wrong: at 3500ms roughly a quarter of cold stats renders - measured 2.7-6.3s - returned an error card instead of a card.

- `?debug=` and `?cache=` are excluded from the cache key, along with `_`-prefixed params: they select a response mode or a TTL rather than a different card. Underscore params also let `embed:smoke --cold` probe a CDN miss without evicting the card.
- Concurrent requests for the same card share one render. Five cards on one README page share a TTL, so they expire together; without coalescing that is five simultaneous GitHub API calls.
- The render is kept for a further `STALE_WINDOW_SECONDS` (24h) past its freshness window, so an upstream outage degrades to an out-of-date card rather than a broken one.
- `RENDER_CACHE=0` disables it. Unset KV leaves process memory only, which is the previous behavior.

### Checking a deploy

`bun run embed:smoke --base <origin> --cold --budget <ms>` renders all five cards with a unique query string, checks status, media type, `ETag`, a cacheable `Cache-Control`, and a structurally renderable `<svg>` with intrinsic `width`/`height`/`viewBox`, a brace-balanced stylesheet and no element hidden behind an animation. It fails when any response exceeds the budget. The budget matters on its own: an endpoint that answers 200 in 9s is still a blank embed in a README, because Camo stops waiting at 10s.

Note that GitHub Camo caches each card for its `max-age`, so a newly deployed fix will not reach a browser that already holds the old copy. Purge Camo or add a cache-busting param to the embed URL when verifying.

## Env vars

Full matrix with defaults lives in `.env.example`. The short version:

| Group | Vars |
| ----- | ---- |
| Tokens | `PAT_1` through `PAT_5`, or a single `GITHUB_TOKEN` seed |
| KV | `UPSTASH_REST_URL` + `UPSTASH_REST_TOKEN` (or `UPSTASH_PREFIX` variants), `PAT_STORE_NAMESPACE`, `REDIS_URL` — also backs the render cache |
| Render cache | `RENDER_CACHE` (`0` disables), `RENDER_DEADLINE_MS` (default 3500) |
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
