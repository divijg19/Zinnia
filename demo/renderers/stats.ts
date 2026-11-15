import { toStatsTheme } from "../../lib/themes/adapters/stats.js";
import type { ThemeDefinition } from "../../lib/themes/registry.js";
import { renderStatsCard } from "../../stats/src/cards/stats.js";
import type { StatsData } from "../../stats/src/fetchers/types.js";

/** Render the stats card for one theme, the way the demo shows it. */
export function renderStats(
	theme: ThemeDefinition,
	fixture: StatsData,
): string {
	return renderStatsCard(fixture, {
		...toStatsTheme(theme),
		theme: theme.name,
		show_icons: true,
		include_all_commits: true,
		disable_animations: true,
		card_width: 495,
	});
}
