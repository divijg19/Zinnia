# streak/ — GitHub contribution-streak card (TypeScript port)

Ported from [DenverCoder1/github-readme-streak-stats](https://github.com/DenverCoder1/github-readme-streak-stats) (PHP) to TypeScript (`streak/CHANGELOG.md`). Project-level docs (install, tests, CI, env) live in the root `README.md`.

## Route

`/api/streak?username=…` (also accepts `?user=`) → `api/streak.ts` → `fetchContributions` + `generateOutput` (`src/index.ts`).

Data comes from the GitHub GraphQL API when a `PAT_*` is configured (`STREAK_FETCH_TIMEOUT_MS`, default 8000ms), with a public-contributions scrape fallback. Responses are cached (`STREAK_CACHE_SECONDS`, fallback `86400`) behind the always-200 + ETag contract.

## Key params

`theme`, `mode` (`daily`/`weekly`), `locale`, `date_format`, `exclude_days`, `card_width`, `disable_animations`, color overrides. `?theme=` names normalize `_` to `-` (first-registered theme wins on collision — see the demo).

## Notes

- `?type=png` renders via `sharp`; when conversion is unavailable the route serves the SVG fallback.
- Preview every theme in the local demo (`bun run demo:dev`) — `lib/themes/registry.ts` is the source of truth.
