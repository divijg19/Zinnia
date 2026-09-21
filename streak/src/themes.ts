// Auto-generated and normalized from canonical registry

import { toStreakTheme } from "../../lib/themes/adapters/streak.js";
import { themes } from "../../lib/themes/registry.js";
import { normalizeThemeName } from "./card_helpers.js";

/**
 * @deprecated Use `import { toStreakTheme } from '../../lib/themes/adapters/streak'` instead.
 * This file will be removed after a deprecation period.
 */
const adaptedThemes: Record<string, ReturnType<typeof toStreakTheme>> = {};
const seenNormalized = new Set<string>();
for (const name of Object.keys(themes)) {
	// Streak resolves theme names case-insensitively with `_`→`-` normalization,
	// so registry keys that normalize to the same streak name (e.g. the trophy
	// `catppuccin_mocha` and the leetcode `catppuccin-mocha`) must not both be
	// exposed; the first occurrence wins, matching legacy streak behavior.
	const normalized = normalizeThemeName(name);
	if (seenNormalized.has(normalized)) {
		continue;
	}
	seenNormalized.add(normalized);
	const def = themes[name];
	if (def) {
		adaptedThemes[name] = toStreakTheme(def);
	}
}

export const THEMES = adaptedThemes;
