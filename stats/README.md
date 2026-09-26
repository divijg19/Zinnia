# stats/

GitHub stats and top-languages cards.

Vendored from [anuraghazra/github-readme-stats](https://github.com/anuraghazra/github-readme-stats), pinned in [UPSTREAM.md](UPSTREAM.md) and adapted for this monorepo. Setup, build, and test instructions live in the root [README](../README.md) and [CONTRIBUTING.md](../CONTRIBUTING.md).

## Routes

- `/api/stats?username=…` serves `api/stats.ts`, which calls `fetchStats` in `src/fetchers/stats.ts` and `renderStatsCard` in `src/cards/stats.ts`.
- `/api/top-langs?username=…` serves `api/top-langs.ts`, which calls `fetchTopLanguages` in `src/fetchers/top-languages.ts` and `renderTopLanguages` in `src/cards/top-languages.ts`.

Both routes share the `createCardHandler` wrapper in `lib/card-handler.ts`, which handles username validation, PAT bootstrap, `?debug=1` diagnostics, `?cache=` resolution (`STATS_CACHE_SECONDS` or `TOP_LANGS_CACHE_SECONDS`, falling back to `86400`), and the always-200 plus ETag contract.

## Parameters

Common to both: `theme`, `hide`, `custom_title`, `locale`, `card_width`, `disable_animations`, and the color overrides `title_color`, `text_color`, `icon_color`, `bg_color`, `border_color`, `ring_color`.

`/api/stats` adds `show`, `show_icons`, `hide_rank`, `include_all_commits`, `commits_year`, `rank_icon`, and `number_format`.

`/api/top-langs` takes `layout` (`compact`, `normal`, `donut`, `donut-vertical`, `pie`), `langs_count`, `stats_format`, and `hide_progress`.

## Themes

The old static `themes/` catalog has been removed. `lib/themes/registry.ts` is the source of truth; run `bun run demo:dev` to preview every theme.
