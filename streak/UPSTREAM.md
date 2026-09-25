Source: https://github.com/DenverCoder1/github-readme-streak-stats
Pinned commit: (unpinned — ported, see notes)

Notes:
- Ported from PHP to TypeScript in this monorepo (`streak/CHANGELOG.md`).
- Original project renders server-side via PHP; our renderer is TS (`src/card.ts`, `src/index.ts`) with PNG conversion via `sharp` and an SVG fallback.
- Local changes: `api/streak.ts` route, Upstash/file response cache, always-200 + ETag contract, canonical theme registry (`lib/themes/registry.ts`).

Sync strategy:
- Cherry-pick upstream calculation/render fixes by porting them to the TS renderer and covering them with Vitest cases.
