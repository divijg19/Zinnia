# My GitHub Visuals

> Note: This repository targets Node.js 24 LTS. Use the project `.nvmrc` (root) or your preferred version manager to set Node 24.

**Packages**
- `streak/` — streak stats card and renderer (see `streak/README.md` for package specifics)
- `stats/` — GitHub README Stats and language/top-langs tooling (see `stats/README.md`)
- `leetcode/` — LeetCode cards and Cloudflare Worker variants (see `leetcode/README.md`)
- `trophy/` — profile trophy renderer (see `trophy/README.md`)

**Development (quickstart)**
- Install (Bun): ``bun install``
- Typecheck: ``bunx tsc --noEmit``
- Run tests: ``bunx vitest --run``
- Lint & format: ``bunx biome check . && bunx biome format . --write``
- Build (root): ``bun run build``

See the **Packages** list above for package-specific docs and examples.

## Monorepo Configuration & Deployment

This repository is a monorepo for GitHub profile visualizations, stats, streaks, trophies, and LeetCode cards. It is ready for deployment on Vercel and CI/CD via GitHub Actions.

### Key Configuration Files (Centralized at Root)
- `vitest.config.ts`: Central Vitest config for all packages. Includes setup for deterministic tests (fixtures/mocks).
- `tsconfig.json`: Root TypeScript config. All package-level tsconfig files extend this.
- `eslint.config.mjs`: Shared ESLint baseline. Packages may extend/override as needed.
- `vercel.json`: Vercel build and route configuration. Each API route (`/trophy`, `/stats`, `/streak`, `/leetcode`, `/github`) maps to a serverless function in the corresponding package.
- `biome.json`: Biome formatting/linting config.

### Testing & CI
- Run all tests with:
	```pwsh
	npm test
	```
- Typecheck:
	```pwsh
	bunx tsc --noEmit
	```
- Lint & format:
	```pwsh
	bunx biome check .
	bunx biome format .
	```
- Testing notes (where to add tests)

- Tests are organized per area to reuse package-level configs:
	- `npm run test` runs the full test matrix under Vitest (root `tests/` plus package-local tests).
	- Tests are consolidated under the repository `tests/` directory; package-local tests that require specialized setup remain in `leetcode/test`.
	- If you need to run a single package's tests, use the package `test` script which delegates to Vitest with the shared root config.

- CI runs lint, typecheck, tests (Vitest) and build. No auto-deploy from CI.

### CI/CD Workflows
- `.github/workflows/ci.yml`: Lint, typecheck, test, build (push/PR). Concurrency-cancel enabled.
- `.github/workflows/refresh.yml`: Daily cache bust + warm of endpoints (uses `PROD_DOMAIN` secret or defaults to zinnia-rho.vercel.app).

### Deployment on Vercel
- **Automatic deployment**: Vercel is connected to GitHub and auto-deploys on push to `main` branch.
- Vercel uses `vercel.json` to build and route serverless functions for each API.
- **Manual deployment** (if needed):
	```pwsh
	npm run vercel:deploy
	```
- **Setup**: Connect your repo in the Vercel dashboard and set required environment variables (see below).
 - **Upstash/Redis (recommended)**: For persistent token rotation and cache counters, set `UPSTASH_REST_URL` and `UPSTASH_REST_TOKEN` (or marketplace-prefixed variants). Optionally set `PAT_STORE_NAMESPACE` to isolate environments. If not set, an in-memory fallback is used.

## Embeds

Replace YOUR-DOMAIN with your deployed Vercel domain. Both direct and /api paths are available; /api is recommended.

- Stats
	- `<img src="https://zinnia-rho.vercel.app/api/stats?username=divijg19&theme=watchdog&cache=86400" />`
- Top Languages
	- `<img src="https://zinnia-rho.vercel.app/api/top-langs?username=divijg19&layout=compact&theme=watchdog&cache=86400" />`
- Streak
	- `<img src="https://zinnia-rho.vercel.app/api/streak?user=divijg19&theme=watchdog&cache=86400" />`
- Trophy
	- Upstream (default proxy):
		- `<img src="https://zinnia-rho.vercel.app/api/trophy?username=divijg19&theme=watchdog&cache=86400" />`
	- Local Node/TS (watchdog supported):
		- `<img src="https://zinnia-rho.vercel.app/api/trophy?username=divijg19&theme=watchdog&columns=6&cache=86400" />`
- LeetCode (US)
	- `<img src="https://zinnia-rho.vercel.app/api/leetcode?username=divijg19&theme=watchdog&cache=86400" />`
- GitHub (placeholder)
	- `<img src="https://zinnia-rho.vercel.app/api/github?username=divijg19&cache_seconds=86400" />`

- Health (diagnostic)
	- `<img src="https://zinnia-rho.vercel.app/api/health?text=OK&cache=60" />`

Tips
- Prefer `cache` to reduce upstream load and speed up render.
- If any embed fails to render on GitHub, open the image URL in a browser and confirm it returns `Content-Type: image/svg+xml` and HTTP 200.
- Use `/api/health` for a quick sanity check. It always returns an SVG with HTTP 200, proper headers, and short cache.

### Cache tuning

You can tune CDN cache defaults via environment variables. The `?cache` query param takes precedence over env defaults. Bounds are 0..604800 seconds (7 days).

- Global default TTL for all services: `CACHE_SECONDS` (default 86400)
- Service-specific TTL env (optional):
	- `LEETCODE_CACHE_SECONDS`
	- `TROPHY_CACHE_SECONDS`
	- `STREAK_CACHE_SECONDS`
	- `STATS_CACHE_SECONDS`
	- `TOP_LANGS_CACHE_SECONDS`

Precedence by service:
- All endpoints: `?cache=...` > service-specific `*_CACHE_SECONDS` > `CACHE_SECONDS` > 86400 default

To set envs in Vercel, use your Project → Settings → Environment Variables. See the next section for a quick checklist.

### Environment variables on Vercel

Recommended non-secret variables you can set in Vercel Project Settings:

- `CACHE_SECONDS` = 86400
- `LEETCODE_CACHE_SECONDS` = 86400
- `TROPHY_CACHE_SECONDS` = 86400
- `STREAK_CACHE_SECONDS` = 86400
- `STATS_CACHE_SECONDS` = 86400
- `TOP_LANGS_CACHE_SECONDS` = 86400

You can also define per-Environment values (Production/Preview/Development) as needed.

### Auth tokens (GitHub PAT) and upstream tokens

Some endpoints require higher GitHub API limits to avoid rate limiting:

- PATs (required for real data on stats/top-langs)
	- PAT_1: GitHub Personal Access Token (classic) with public_repo scope is sufficient
	- Optional rotation: PAT_2, PAT_3, ... (the stats service will pick among available tokens)
	- Without a PAT, the endpoints still return a valid SVG with guidance text so GitHub embeds don’t break.

-- Optional upstream tokens
	- Trophy upstream auth: If callers supply a `token` query param, the Trophy endpoint will use it. Otherwise the service uses centralized PAT rotation (`PAT_1..PAT_5`) to provide upstream auth and will mark exhausted keys on 401/403. Trophy mode is controlled by the `?mode=` query parameter (e.g. `?mode=local`).

### Validate environment

Run a quick validation before deploy to ensure PATs and Upstash are configured:

```pwsh
node scripts/validate-env.mjs
```

### Cache-busting when updating embeds

GitHub caches images aggressively. If you’ve just deployed changes, add a dummy query param like `&v=1730850000` to the image URL to force a fresh fetch:

```markdown
![stats](https://zinnia-rho.vercel.app/api/stats?username=divijg19&v=1730850000)
```

## Developer Notes

See `DEV_NOTES.md` for implementation details, service-specific notes, and porting roadmaps (e.g., the Trophy TS port plan).

### Maintainer Notes
- All configs are now centralized. Add new packages by extending root configs.
- Use a single lockfile (`bun.lockb`) for deterministic installs.
- For CI caching, see Vercel and GitHub Actions docs for best practices.

---
For questions or contributions, see the individual package README files or open an issue.
