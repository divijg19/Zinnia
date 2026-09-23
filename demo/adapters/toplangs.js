import { toStatsTheme } from "../../lib/themes/adapters/stats.ts";
import { renderTopLanguages } from "../../stats/src/cards/top-languages.ts";

export function renderTopLangs(theme, fixture) {
	return renderTopLanguages(fixture, {
		...toStatsTheme(theme),
		theme: theme.name,
		disable_animations: true,
		// Narrower than the other demo cards: compact's stacked bar +
		// 2-column names stay proportionate around 320 wide (495 leaves
		// the short 165-tall card looking stretched).
		card_width: 320,
		// Compact layout everywhere in demo/: 2-column names under a
		// single stacked bar. Renderer defaults apply otherwise
		// (all 6 fixture langs, progress bar shown).
		layout: "compact",
	});
}
