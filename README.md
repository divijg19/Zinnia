# `Zinnia`

## Unified GitHub Visuals & Telemetry

> **Runtime target:** Node.js **24 LTS**
> Use the root `.nvmrc` (or your preferred version manager) to ensure Node 24.

`Zinnia` is a **unified, self-hosted GitHub profile visualization and telemetry engine**.
It consolidates multiple independently authored visual widgets into a **single TypeScript monorepo**, exposing coherent SVG endpoints via one deploy surface.

Rather than composing external services at render time, `Zinnia` hard-forks upstream projects, refactors them into a shared architecture, and owns the full rendering and deployment pipeline.

---

## Packages

Each package is independently documented and exposed through a shared build, test, and deploy system.

* `streak/` — GitHub contribution streak renderer
  *(see `streak/README.md`)*

* `stats/` — GitHub README stats and language breakdown tooling
  *(see `stats/README.md`)*

* `leetcode/` — LeetCode profile cards, including Cloudflare Worker variants
  *(see `leetcode/README.md`)*

* `trophy/` — Profile trophy renderer
  *(see `trophy/README.md`)*

---

## Development (Quickstart)

All tooling is standardized at the repository root.

* Install dependencies:

  ```sh
  bun install
  ```

* Typecheck:

  ```sh
  bunx tsc --noEmit
  ```

* Run tests:

  ```sh
  bunx vitest --run
  ```

* Lint & format:

  ```sh
  bunx biome check .
  bunx biome format . --write
  ```

* Build (all packages):

  ```sh
  bun run build
  ```

Refer to individual package READMEs for package-specific scripts and examples.

---

## Monorepo Architecture & Deployment

`Zinnia` is structured as a **single monorepo** for profile visuals, trophies, stats (and top-langs), streaks, and LeetCode cards.
It is designed for **deterministic builds**, **centralized configuration**, and **serverless deployment on Vercel**.

### Centralized Configuration (Root)

* `tsconfig.json`
  Root TypeScript configuration; all package configs extend this.

* `vitest.config.ts`
  Shared Vitest configuration with deterministic fixtures and mocks.

* `biome.json`
  Unified formatting and linting rules.

* `vercel.json`
  Build and routing configuration. Each endpoint (`/stats`, `/streak`, `/trophy`, `/leetcode`, `/github`) maps to a serverless function implemented in the corresponding package.

---

## Testing & CI

### Local Testing

* Run the full test suite:

  ```sh
  bun run test
  ```

* Typecheck:

  ```sh
  bunx tsc --noEmit
  ```

* Lint & format:

  ```sh
  bunx biome check .
  bunx biome format .
  ```

### Test Layout

* Root `tests/` contains shared and cross-package tests.
* Package-local tests remain where specialized setup is required (e.g. `leetcode/test`).
* Package `test` scripts delegate to Vitest using the shared root configuration.

### CI Behavior

CI runs:

* Lint
* Typecheck
* Tests (Vitest)
* Build

CI does **not** auto-deploy.

---

## CI/CD Workflow

* `.github/workflows/ci.yml`
  Runs lint, typecheck, tests, and build on push/PR.
  Concurrency cancellation is enabled.

## Deployment (Vercel)

* **Automatic deployment:**
  Vercel is connected to GitHub and deploys automatically on pushes to `main`.

* **Manual deployment (optional):**

  ```sh
  bun run vercel:deploy
  ```

* **Setup:**
  Connect the repository in the Vercel dashboard and configure the required environment variables.

### Optional: Upstash / Redis

For persistent token rotation and cache counters:

* `UPSTASH_REST_URL`
* `UPSTASH_REST_TOKEN`

Optional:

* `PAT_STORE_NAMESPACE` to isolate environments

If not configured, `Zinnia` falls back to in-memory storage.

---

## Embeds

Replace `zinnia-rho.vercel.app` with `YOUR DOMAIN` your deployed Vercel domain.
Both direct and `/api` paths are available; `/api` is recommended.

### GitHub Stats

```html
<img src="https://zinnia-rho.vercel.app/api/stats?username=divijg19&theme=watchdog&cache=86400" />
```

### Top Languages

```html
<img src="https://zinnia-rho.vercel.app/api/top-langs?username=divijg19&layout=compact&theme=watchdog&cache=86400" />
```

### Streak

```html
<img src="https://zinnia-rho.vercel.app/api/streak?user=divijg19&theme=watchdog&cache=86400" />
```

### Trophy

```html
<img src="https://zinnia-rho.vercel.app/api/trophy?username=divijg19&theme=watchdog&cache=86400" />
```

### LeetCode (US)

```html
<img src="https://zinnia-rho.vercel.app/api/leetcode?username=divijg19&theme=watchdog&cache=86400" />
```

### GitHub (placeholder)

```html
<img src="https://zinnia-rho.vercel.app/api/github?username=divijg19&cache_seconds=86400" />
```

### Health Check

```html
<img src="https://zinnia-rho.vercel.app/api/health?text=OK&cache=60" />
```

**Tips**

* Prefer the `cache` query parameter to reduce upstream load.
* If an embed fails on GitHub, open the image URL directly and verify:

  * `Content-Type: image/svg+xml`
  * HTTP 200
* `/api/health` always returns a valid SVG for diagnostics.

---

## Cache Tuning

Cache TTL can be controlled via query params or environment variables.
Valid range: **0–604800 seconds** (7 days).

### Defaults

* Global default: `CACHE_SECONDS` (default: `86400`)

### Service-specific overrides (optional)

* `LEETCODE_CACHE_SECONDS`
* `TROPHY_CACHE_SECONDS`
* `STREAK_CACHE_SECONDS`
* `STATS_CACHE_SECONDS`
* `TOP_LANGS_CACHE_SECONDS`

**Precedence**

```
?cache → SERVICE_CACHE_SECONDS → CACHE_SECONDS → 86400
```

---

## Environment Variables (Vercel)

Recommended non-secret defaults:

```
CACHE_SECONDS=86400
LEETCODE_CACHE_SECONDS=86400
TROPHY_CACHE_SECONDS=86400
STREAK_CACHE_SECONDS=86400
STATS_CACHE_SECONDS=86400
TOP_LANGS_CACHE_SECONDS=86400
```

Values can be scoped per environment (Production / Preview / Development).

---

## Auth Tokens (GitHub PATs)

Some endpoints require higher GitHub API limits.

### PAT Mapping

* `PAT_1` — stats & top-langs
* `PAT_2` — leetcode
* `PAT_3` — trophy
* `PAT_4` — streak
* `PAT_5` — optional global fallback

Each token should have `public_repo` (or equivalent) scope.

Endpoints will return a guidance SVG without PATs, but will be rate-limited.

### Optional Upstream Tokens

* Trophy upstream auth:

  * Callers may pass a `token` query parameter
  * Otherwise centralized PAT rotation is used
  * Keys returning 401/403 are automatically marked as exhausted

---

## Environment Validation

Before deploying, validate configuration:

```sh
bun scripts/validate-env.mjs
```

---

## Cache Busting for GitHub Embeds

GitHub caches images aggressively.
To force refresh after a deploy, append a dummy query parameter:

```markdown
![stats](https://zinnia-rho.vercel.app/api/stats?username=divijg19&v=1730850000)
```

---

## Maintainer Notes

* All configuration is centralized at the root.
* New packages should extend existing root configs.
* A single lockfile (`bun.lock`) is used for deterministic installs.
* For CI caching strategies, refer to Vercel and GitHub Actions documentation.

---

For questions, issues, or contributions, refer to the individual package READMEs or open an issue in the repository.
