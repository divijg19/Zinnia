import { toStatsTheme } from "../../lib/themes/adapters/stats.ts";
import { renderTopLanguages } from "../../stats/src/cards/top-languages.ts";

export function renderTopLangs(theme, fixture) {
	return renderTopLanguages(fixture, {
		...toStatsTheme(theme),
		theme: theme.name,
		disable_animations: true,
		card_width: 495,
	});
}
