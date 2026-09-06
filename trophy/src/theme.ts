import { toTrophyTheme } from "../../lib/themes/adapters/trophy.js";
import { themes } from "../../lib/themes/registry.js";

const adaptedColors: Record<string, ReturnType<typeof toTrophyTheme>> = {};
for (const name of Object.keys(themes)) {
	const def = themes[name];
	if (def) {
		adaptedColors[name] = toTrophyTheme(def);
	}
}

/**
 * All widget themes adapted from the canonical registry.
 */
export const COLORS = adaptedColors;

export type Theme = ReturnType<typeof toTrophyTheme>;
