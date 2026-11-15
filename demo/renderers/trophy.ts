import { toTrophyTheme } from "../../lib/themes/adapters/trophy.js";
import type { ThemeDefinition } from "../../lib/themes/registry.js";
import { Card } from "../../trophy/src/card.js";
import type { UserInfo } from "../../trophy/src/user_info.js";

/** Render the trophy card for one theme, the way the demo shows it. */
export function renderTrophy(
	theme: ThemeDefinition,
	fixture: UserInfo,
): string {
	// Empty titles/ranks disables filtering so the showcase fixture renders
	// every earned trophy in a compact 3x3 grid (maxRow 0 = uncapped rows).
	const card = new Card([], [], 3, 0, 125, 0, 0, false, false);
	return card.render(fixture, toTrophyTheme(theme));
}
