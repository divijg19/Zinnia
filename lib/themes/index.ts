// Canonical theme library entry point.
// Exports the canonical registry/types and all widget adapters.

export { toLeetCodeTheme } from "./adapters/leetcode.js";
export type { StatsThemeProperties } from "./adapters/stats.js";
export { toStatsTheme } from "./adapters/stats.js";
export type { StreakThemeProperties } from "./adapters/streak.js";
export { toStreakTheme } from "./adapters/streak.js";
export type { TrophyThemeProperties } from "./adapters/trophy.js";
export { toTrophyTheme } from "./adapters/trophy.js";
export type {
	ColorToken,
	GradientToken,
	LeetCodeThemeProperties,
	ThemeColors,
	ThemeDefinition,
} from "./registry.js";
export { themes, WATCHDOG } from "./registry.js";
