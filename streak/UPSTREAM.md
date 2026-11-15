Source: https://github.com/DenverCoder1/github-readme-streak-stats
Pinned commit: not pinned, the code was ported rather than vendored verbatim (see notes)

Notes:

- Ported from PHP to TypeScript in this monorepo (`streak/CHANGELOG.md`).
- Original project renders server-side via PHP; our renderer is TS (`src/card.ts`, `src/index.ts`) with PNG conversion via `sharp` and an SVG fallback.
- Local changes: `api/streak.ts` route (which now owns the renderer loader), Upstash/file response cache, always-200 + ETag contract, canonical theme registry (`lib/themes/registry.ts`).
- `src/loader.ts` was not ported: the renderer loader moved into the route, and the fallback card it carried is `lib/canonical/fallback-card.ts`.

Sync strategy:

- Cherry-pick upstream calculation/render fixes by porting them to the TS renderer and covering them with Vitest cases.
