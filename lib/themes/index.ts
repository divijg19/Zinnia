// Canonical theme library entry point.
// Exports the canonical registry/types and the Stats adapter.
// Types for other widgets are defined in registry but adapters deferred.

export type { StatsThemeProperties } from "./adapters/stats";
export { toStatsTheme } from "./adapters/stats";
export type {
	ColorToken,
	GradientToken,
	LeetCodeThemeProperties,
	StreakThemeProperties,
	ThemeColors,
	ThemeDefinition,
	TrophyThemeProperties,
} from "./registry";
export { themes, WATCHDOG } from "./registry";
