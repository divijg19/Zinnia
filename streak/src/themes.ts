// Auto-generated and normalized from canonical registry

import { toStreakTheme } from "../../lib/themes/adapters/streak.js";
import { themes } from "../../lib/themes/registry.js";

const adaptedThemes: Record<string, ReturnType<typeof toStreakTheme>> = {};
for (const name of Object.keys(themes)) {
	const def = themes[name];
	if (def) {
		adaptedThemes[name] = toStreakTheme(def);
	}
}

export const THEMES = adaptedThemes;
