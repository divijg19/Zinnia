# `Zinnia`

Self-hosted GitHub profile cards: **stats**, **top languages**, **contribution
streak**, **trophies** and **LeetCode**. One TypeScript monorepo, one deploy
surface, no account to sign up for.

```html
<img src="https://zinnia-rho.vercel.app/api/stats?username=YOUR_NAME&theme=watchdog" alt="GitHub Stats" />
```

Every card answers **200 with a renderable SVG**, carries an `ETag`, and
degrades to the last good render instead of breaking when GitHub is slow.
That is the whole design: an embed that shows an error is still an embed, an
embed that shows nothing is a broken image on someone's profile.

> **Runtime:** Node.js 26 (`engines.node`) runs the deployed functions and the
> test process; Bun installs, builds and runs the scripts. Live at
> `zinnia-rho.vercel.app`.

## Getting started

```sh
bun install --frozen-lockfile   # dependencies
bun run build                   # the five card shards
bun run demo:build              # prerender the demo assets and bundle the demo page
bun run test                    # rebuild, then run vitest
bun run lint                    # biome + tsc
```

Targeted suites: `bun run test:api`, `test:stats`, `test:demo`, `test:leetcode`.
Type-check only: `bun run type-check`. Format: `bun run format`.

## Routes

All handlers live in `api/*.ts`; Vercel rewrites `/(.*)` onto `/api/$1`.

| Route                                         | Card                                                      |
| --------------------------------------------- | --------------------------------------------------------- |
| `/api/stats?username=…`                       | stats                                                     |
| `/api/top-langs?username=…`                   | top languages                                             |
| `/api/streak?username=…` (`user=` also works) | contribution streak                                       |
| `/api/trophy?username=…`                      | profile trophies                                          |
| `/api/leetcode?username=…`                    | LeetCode stats                                            |
| `/api/health`                                 | a health **SVG** card, embeddable (`?text=` custom label) |
| `/api/healthz` (`/api/__health` alias)        | a health **JSON** probe (`{"ok":true}`, `X-Ready: 1`)     |

## What you can rely on

- **Always 200, always a card.** No empty bodies, no bare 304s, no
  animation-dependent rendering. When GitHub is slow, the previous render is
  served; when there is none, an error card is.
- **A cache that answers.** A render is kept in memory and, when configured,
  in Upstash KV, so a revalidation never waits on the GitHub API.
- **A budget that fits the embedder.** GitHub's image proxy stops waiting at
  ten seconds; the whole response is budgeted to stay inside it.
- **One manifest.** The URLs embedded in the profile README are declared in
  `config/embeds.json`, and the warmer, the smoke check and CI all read it.

## Configuration

| Group        | Variables                                                                              |
| ------------ | -------------------------------------------------------------------------------------- |
| Tokens       | `PAT_1`…`PAT_5`, or a single `GITHUB_TOKEN`                                            |
| KV           | `UPSTASH_REST_URL` + `UPSTASH_REST_TOKEN`, `PAT_STORE_NAMESPACE`                       |
| Render cache | `RENDER_CACHE` (`0` disables), `RENDER_DEADLINE_MS`, `RENDER_CEILING_MS`               |
| Cache TTLs   | `CACHE_SECONDS` plus six service overrides                                             |
| Timeouts     | `STATS_GRAPHQL_TIMEOUT_MS`, `STREAK_FETCH_TIMEOUT_MS`, and three more (default 6000ms) |

The full matrix, with defaults and annotations, is in
[.env.example](.env.example).

## Documentation

- **[Response contract](docs/RESPONSE-CONTRACT.md)** - what every card route
  guarantees, the headers, the cache tiers, the diagnostics and the error codes.
- **[Caching](docs/CACHING.md)** - the TTLs, the render cache, the two render
  budgets and the arithmetic behind them.
- **[Embeds](docs/EMBEDS.md)** - the manifest, the warmer, the smoke check, and
  what GitHub's image proxy does to a slow card.
- **[Configuration](docs/CONFIGURATION.md)** - the environment variables, the KV
  resolution and the PAT rotation.
- **[Themes](docs/THEMES.md)** - the registry, the adapters and the demo.
- **[Deployment](docs/DEPLOYMENT.md)** - the runtimes, the build, the functions
  and the CI.
- [CONTRIBUTING.md](CONTRIBUTING.md) - local setup, build, tests, conventions
- [SECURITY.md](SECURITY.md) - reporting a vulnerability
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) - expectations for contributors

Per package: [stats](stats/README.md) · [streak](streak/README.md) ·
[trophy](trophy/README.md) · [leetcode](leetcode/README.md)

Provenance, for anyone re-syncing a vendored upstream: [stats](stats/UPSTREAM.md)
· [streak](streak/UPSTREAM.md) · [trophy](trophy/UPSTREAM.md) ·
[leetcode](leetcode/UPSTREAM.md)
