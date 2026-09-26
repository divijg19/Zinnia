# streak/

GitHub contribution-streak card, ported to TypeScript (see [CHANGELOG.md](CHANGELOG.md)).

Ported from [DenverCoder1/github-readme-streak-stats](https://github.com/DenverCoder1/github-readme-streak-stats), pinned in [UPSTREAM.md](UPSTREAM.md). Setup, build, and test instructions live in the root [README](../README.md) and [CONTRIBUTING.md](../CONTRIBUTING.md).

## Route

`/api/streak?username=…` serves `api/streak.ts`, which calls `fetchContributions` and `generateOutput` from `src/index.ts`. `?user=` is accepted as an alias for `?username=`.

Data comes from the GitHub GraphQL API when a `PAT_*` is configured, with a public-contributions scrape as the fallback. `STREAK_FETCH_TIMEOUT_MS` bounds both (default 8000ms). Responses are cached under `STREAK_CACHE_SECONDS` (fallback `86400`) and follow the always-200 plus ETag contract.

## Parameters

`theme`, `mode` (`daily` or `weekly`), `locale`, `date_format`, `exclude_days`, `card_width`, `disable_animations`, and the color overrides. Theme names normalize `_` to `-`; on a collision the first registered name wins.

`?type=png` renders through `sharp`. When conversion is unavailable the route serves the SVG instead.

## Themes

`lib/themes/registry.ts` is the source of truth for themes. Run `bun run demo:dev` to preview them.
