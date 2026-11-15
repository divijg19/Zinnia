import { toStatsTheme } from "../../lib/themes/adapters/stats.js";
import type { ThemeDefinition } from "../../lib/themes/registry.js";
import { renderTopLanguages } from "../../stats/src/cards/top-languages.js";
import type { TopLangData } from "../../stats/src/fetchers/types.js";

/** Render the top-languages card for one theme, the way the demo shows it. */
export function renderTopLangs(
	theme: ThemeDefinition,
	fixture: TopLangData,
): string {
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
