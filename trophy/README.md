# trophy/ — GitHub profile-trophy card

Vendored from [ryo-ma/github-profile-trophy](https://github.com/ryo-ma/github-profile-trophy) (`trophy/UPSTREAM.md`), with the Deno implementation replaced by a Node/Vercel-friendly renderer. Project-level docs (install, tests, CI, env) live in the root `README.md`.

## Route

`/api/trophy?username=…` → `api/trophy.ts` → `renderTrophySVG` (`src/renderer.ts`).

Responses are cached (`TROPHY_CACHE_SECONDS`, fallback `86400`) behind the always-200 + ETag contract.

## Ranks

Trophies rank up through SECRET, SSS, SS, S, AAA, AA, A, B, C (worst). Each trophy defines its own score thresholds in `src/trophy.ts` — e.g. different commit/star/follower counts per tier.

## Key params

`theme`, `columns`, `margin_w`, `margin_h`, `no-frame`, `no-bg`, `title` overrides. Preview every theme in the local demo (`bun run demo:dev`) — `lib/themes/registry.ts` is the source of truth.
