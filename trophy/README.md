# trophy/

GitHub profile-trophy card.

Vendored from [ryo-ma/github-profile-trophy](https://github.com/ryo-ma/github-profile-trophy), pinned in [UPSTREAM.md](UPSTREAM.md), with the Deno implementation replaced by a Node and Vercel friendly renderer. Setup, build, and test instructions live in the root [README](../README.md) and [CONTRIBUTING.md](../CONTRIBUTING.md).

## Route

`/api/trophy?username=…` serves `api/trophy.ts`, which calls `renderTrophySVG` in `src/renderer.ts`.

Responses are cached under `TROPHY_CACHE_SECONDS` (fallback `86400`) and follow the always-200 plus ETag contract.

## Ranks

Trophies rank up through SECRET, SSS, SS, S, AAA, AA, A, B, and C (worst). Each trophy sets its own score thresholds in `src/trophy.ts`, so the commit, star, and follower counts required differ per tier.

## Parameters

`theme`, `columns`, `margin_w`, `margin_h`, `no-frame`, `no-bg`, and `title` overrides.

## Themes

`lib/themes/registry.ts` is the source of truth for themes. Run `bun run demo:dev` to preview them.
