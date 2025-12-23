export type { StreakRenderer } from "../../streak/src/loader";
export { loadStreakRenderer, renderFallbackSvg } from "../../streak/src/loader";

// Re-export only; avoid creating local bindings or referencing re-exported
// names in a default value which would be undefined at module-evaluation
// time in some loaders.
