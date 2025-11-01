# Zinnia Dev Notes (Bun + Biome)

- Runtime: Bun 1.3
- Formatter/Linter: Biome 2.2.5
- Services to host:
  - Trophy
  - Stats
  - Streak
  - LeetCode
- Single Vercel app with route rewrites
- Daily GitHub Action refresh
- Clean SVG endpoints for README embeds

## Trophy Service (TS Port Roadmap)

Goal: Remove reliance on the upstream Deno app while keeping high-quality SVG output. We will stage the port to minimize risk:

1) Local minimal renderer (done)
- File: `trophy/src/renderer.ts`
- Generates a simple, themeable grid-based trophy SVG.
- Activated via `?mode=local` or env `TROPHY_MODE=local`.
- Headers: `Content-Type: image/svg+xml`, `Cache-Control: public, max-age=300`.

2) Proxy-by-default (current behavior)
- File: `trophy/api/index.ts`
- Default mode is `proxy`, which fetches from `https://github-profile-trophy.vercel.app` and returns the SVG.
- Rationale: complete feature coverage while the local port matures.

3) Incremental data integration
- Add GitHub GraphQL calls (reuse PAT_1 if present) to compute basic achievements.
- Start with a limited subset (e.g., contributions, public repos, stars) and render locally.
- Add deterministic unit tests with fixtures; do not rely on network in tests.

4) Flip default to local
- After parity is acceptable, set default `TROPHY_MODE=local` in production.
- Keep `?mode=proxy` as an escape hatch.

Env variables
- `TROPHY_MODE`: `proxy` (default) or `local`.
- `TROPHY_TOKEN`: optional passthrough token for upstream when proxying.
- `PAT_1`: optional GitHub PAT to enable local data fetching in future steps.

## CI/CD

- Workflow: `.github/workflows/ci.yml`
  - Bun install → format (Biome) → lint (Biome) → type-check (tsc) → Jest (stats) → Vitest (leetcode) → optional deploy → warm cache
  - Secrets: `VERCEL_TOKEN` for deploy on main, `PROD_DOMAIN` to warm images post-deploy

## Testing

- Stats uses Jest; LeetCode uses Vitest with fixtures/mocks to avoid live network.
- Windows-safe globs are quoted in scripts to prevent PowerShell expansion.

## Vercel Routing

- See `vercel.json` for builds and routes.
- Both `/service` and `/api/service` are supported for all services.
