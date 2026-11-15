# Configuration

The full matrix with defaults lives in [.env.example](../.env.example). This
is the short version.

| Group        | Variables                                                                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tokens       | `PAT_1` through `PAT_5`, or a single `GITHUB_TOKEN` seed                                                                                                                        |
| KV           | `UPSTASH_REST_URL` + `UPSTASH_REST_TOKEN` (or the `UPSTASH_PREFIX` variants), `PAT_STORE_NAMESPACE`, `REDIS_URL`                                                                |
| Render cache | `RENDER_CACHE` (`0` disables), `RENDER_DEADLINE_MS` (default 3500), `RENDER_CEILING_MS` (default 7000)                                                                          |
| Cache TTLs   | `CACHE_SECONDS` plus six service overrides                                                                                                                                      |
| Timeouts     | `STATS_GRAPHQL_TIMEOUT_MS`, `STATS_REST_TIMEOUT_MS`, `STREAK_FETCH_TIMEOUT_MS`, `TROPHY_GRAPHQL_TIMEOUT_MS`, `LEETCODE_GRAPHQL_TIMEOUT_MS` (default 6000ms; KV fixed at 5000ms) |
| File cache   | `CACHE_DIR`, `TROPHY_CACHE_DIR`, `STREAK_CACHE_DIR` (best-effort, off unless set)                                                                                               |

## KV

One endpoint resolution serves every consumer: `lib/kv/credentials.ts` reads
the candidates, so the render cache, the PAT store and the streak contribution
cache cannot end up pointed at different buckets by a name only one of them
knows. `UPSTASH_PREFIX` is read per call rather than frozen at import, so a
marketplace install that injects its environment late still resolves.

## PAT rotation

Each service prefers its own token and falls back to global rotation
(`SERVICE_PAT_MAP` in `lib/tokens.ts`):

| Service          | Preferred |
| ---------------- | --------- |
| stats, top-langs | `PAT_1`   |
| leetcode         | `PAT_2`   |
| trophy           | `PAT_3`   |
| streak           | `PAT_4`   |

`PAT_1` is seeded automatically from `GITHUB_TOKEN` and the other common
aliases, and from an `Authorization` or `x-github-token` request header. See
`lib/env.ts` and `seedServicePat`.

Exhausted tokens are skipped. A rate-limited key is set aside for 60s and an
auth failure for 300s; both windows are hardcoded in
`stats/src/common/retryer.ts` rather than configurable. Stats, top-langs and
streak mark exhaustion; the trophy and leetcode routes do not, so a key that
rate-limits those two is retried on the next request. Exhaustion state is
persisted to KV when a store is configured. A fetch timeout returns the error
card immediately; tokens are never retried within the same request.

## Debug switches

All are off unless set to `1`, and all only add logging; none changes the
card output.

| Variable                        | What it adds                                                            |
| ------------------------------- | ----------------------------------------------------------------------- |
| `TOKENS_DEBUG`                  | PAT selection and seeding decisions                                     |
| `STREAK_DEBUG`                  | streak renderer and cache decisions                                     |
| `TROPHY_DEBUG`                  | trophy renderer resolution                                              |
| `LEETCODE_DEBUG`                | leetcode renderer resolution                                            |
| `UPSTASH_DEBUG`                 | KV read and write failures                                              |
| `ZINNIA_EXPOSE_ERROR_HEADERS=1` | echoes the error code and message to `X-Error-Code` / `X-Error-Message` |
