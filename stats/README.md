# stats/ — GitHub stats + top-languages cards

Vendored from [anuraghazra/github-readme-stats](https://github.com/anuraghazra/github-readme-stats) (`stats/UPSTREAM.md`), adapted for this monorepo. Project-level docs (install, tests, CI, env) live in the root `README.md`.

## Routes

- `/api/stats?username=…` → `api/stats.ts` → `fetchStats` (`src/fetchers/stats.ts`) + `renderStatsCard` (`src/cards/stats.ts`)
- `/api/top-langs?username=…` → `api/top-langs.ts` → `fetchTopLanguages` (`src/fetchers/top-languages.ts`) + `renderTopLanguages` (`src/cards/top-languages.ts`)

Both routes share the `createCardHandler` wrapper (`lib/card-handler.ts`): username validation, PAT bootstrap, `?debug=1` diagnostics, `?cache=` resolution (`STATS_CACHE_SECONDS` / `TOP_LANGS_CACHE_SECONDS`, fallback `86400`), and the always-200 + ETag contract.

## Key params

`theme`, `hide`, `show`, `custom_title`, `locale`, `card_width`, `disable_animations`, color overrides (`title_color`, `text_color`, `icon_color`, `bg_color`, `border_color`, `ring_color`).
Stats adds `show_icons`, `hide_rank`, `include_all_commits`, `commits_year`, `rank_icon`, `number_format`.
Top-langs adds `layout` (`compact`, `normal`, `donut`, `donut-vertical`, `pie`), `langs_count`, `stats_format`, `hide_progress`.

Preview every theme in the local demo (`bun run demo:dev`) — the static `themes/` catalog was removed; `lib/themes/registry.ts` is the source of truth.
