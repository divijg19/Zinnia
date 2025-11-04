Source: https://github.com/DenverCoder1/github-readme-streak-stats
Pinned commit: a2a1fa016a728d60e65882fc3b62a9050ce28f7e (previous submodule pointer)

Notes:
- Vendored for a thin proxy adapter to maintain Node-only deployment and consistent headers.
- Local changes: `api/index.ts` proxy with SVG headers and CDN caching.

Sync strategy:
- Since we proxy upstream, only breaking changes in upstream parameters need attention.
