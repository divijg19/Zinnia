# leetcode/

LeetCode stats card.

Vendored from [JacobLinCool/LeetCode-Stats-Card](https://github.com/JacobLinCool/LeetCode-Stats-Card), pinned in [UPSTREAM.md](UPSTREAM.md) and adapted for Node and Vercel. Setup, build, and test instructions live in the root [README](../README.md) and [CONTRIBUTING.md](../CONTRIBUTING.md).

## Route

`/api/leetcode?username=…` serves `api/leetcode.ts`, which calls `Generator` in `packages/core/src/card.ts`.

The US site is the default: `site` defaults to `us`, and `cn` is only partially supported by some extensions. Fetches are bounded by `LEETCODE_GRAPHQL_TIMEOUT_MS` (default 8000ms). Responses are cached under `LEETCODE_CACHE_SECONDS` (fallback `86400`) and follow the always-200 plus ETag contract.

## Parameters

`theme` accepts any of the 96 registry themes through `ThemeExtension`. Also available: `ext` (the heatmap, activity, contest, font, and animation extensions), `font`, `animation`, `width`, `height`, and `cache`. `?cache=` is clamped to the documented range.

## Themes

Palettes derive from `lib/themes/registry.ts` through `toLeetCodeTheme` in `lib/themes/adapters/leetcode.ts`. The legacy per-theme modules have been removed. Run `bun run demo:dev` to preview every theme.
