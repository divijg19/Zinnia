# leetcode/ — LeetCode stats card

Vendored from [JacobLinCool/LeetCode-Stats-Card](https://github.com/JacobLinCool/LeetCode-Stats-Card) (`leetcode/UPSTREAM.md`), adapted for Node/Vercel deployment. Project-level docs (install, tests, CI, env) live in the root `README.md`.

## Route

`/api/leetcode?username=…` → `api/leetcode.ts` → `Generator` (`packages/core/src/card.ts`).

US site by default (`site` defaults to `us`; `cn` is partially supported by some extensions). Fetches are bounded by `LEETCODE_GRAPHQL_TIMEOUT_MS` (default 8000ms). Responses are cached (`LEETCODE_CACHE_SECONDS`, default `86400`) behind the always-200 + ETag contract.

## Key params

`theme` (any of the 96 registry themes via `ThemeExtension`), `ext` (heatmap, activity, contest, font, animation extensions), `font`, `animation`, `width`, `height`, `cache`. `?cache=` is clamped to the documented range.

## Notes

- Theme palettes derive from `lib/themes/registry.ts` via `toLeetCodeTheme` (`lib/themes/adapters/leetcode.ts`); the legacy per-theme modules were removed.
- Preview every theme in the local demo (`bun run demo:dev`).
