# My GitHub Visuals

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
- CI runs format, lint, typecheck, Jest (stats), and Vitest (leetcode) tests. Vercel deploys automatically if configured.

### Deployment on Vercel
- Vercel uses `vercel.json` to build and route serverless functions for each API.
- To deploy manually:
	```pwsh
	npm run vercel:deploy
	```
- For GitHub integration, connect your repo in the Vercel dashboard and set any required environment variables.

### Maintainer Notes
- All configs are now centralized. Add new packages by extending root configs.
- Use a single lockfile (`bun.lockb`, `package-lock.json`, or `pnpm-lock.yaml`) for deterministic installs.
- For CI caching, see Vercel and GitHub Actions docs for best practices.

---
For questions or contributions, see the individual package README files or open an issue.
