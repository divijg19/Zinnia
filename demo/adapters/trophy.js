import { toTrophyTheme } from "../../lib/themes/adapters/trophy.ts";
import { Card } from "../../trophy/src/card.ts";

export function renderTrophy(theme, fixture) {
	// Empty titles/ranks disables filtering so the showcase fixture renders
	// every earned trophy in a compact 3x3 grid (maxRow 0 = uncapped rows).
	const card = new Card([], [], 3, 0, 125, 0, 0, false, false);
	return card.render(fixture, toTrophyTheme(theme));
}
