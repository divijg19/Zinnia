// Canonical theme library entry point.
// Exports the canonical registry/types and all widget adapters.

export type { StatsThemeProperties } from "./adapters/stats";
export { toStatsTheme } from "./adapters/stats";
export type {
	ColorToken,
	GradientToken,
	ThemeColors,
	ThemeDefinition,
} from "./registry";
export { themes, WATCHDOG } from "./registry";
