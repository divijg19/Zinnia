import { toStatsTheme } from "../../lib/themes/adapters/stats.ts";
import { renderStatsCard } from "../../stats/src/cards/stats.ts";

export function renderStats(theme, fixture) {
	return renderStatsCard(fixture, {
		...toStatsTheme(theme),
		theme: theme.name,
		show_icons: true,
		include_all_commits: true,
		disable_animations: true,
		card_width: 495,
	});
}
