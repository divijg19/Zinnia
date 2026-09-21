import { toTrophyTheme } from "../../lib/themes/adapters/trophy.ts";
import { Card } from "../../trophy/src/card.ts";

export function renderTrophy(theme, fixture) {
	// Empty titles/ranks disables filtering so the showcase fixture renders
	// every earned trophy; rows grow automatically (maxRow 0 = uncapped).
	const card = new Card([], [], 7, 0, 125, 0, 0, false, false);
	return card.render(fixture, toTrophyTheme(theme));
}
