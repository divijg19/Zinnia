import type { ThemeColors } from "./registry";

/**
 * Read a raw color token string from canonical theme colors.
 *
 * `ColorToken` stores the raw string directly; `{hex}` structs expose it;
 * structured gradients serialize back to the historic `"angle,hex,..."`
 * token. Returns `undefined` when the token is absent.
 */
export function tokenHex(
	colors: ThemeColors | undefined,
	token: keyof ThemeColors,
): string | undefined {
	const value = colors?.[token];
	if (!value) {
		return undefined;
	}
	if (typeof value === "string") {
		return value;
	}
	if ("hex" in value) {
		return value.hex;
	}
	if ("stops" in value) {
		const stops = value.stops.map((s) => s.hex).join(",");
		return value.angle !== undefined ? `${value.angle},${stops}` : stops;
	}
	return undefined;
}

export interface NormalizeColorOptions {
	/** Pass through `url(...)` references (streak rings). */
	allowUrl?: boolean;
	/** Pass through bare named colors like `red` (trophy ranks). */
	allowNamed?: boolean;
}

/**
 * Normalize a raw token for SVG output: trim, keep `#...`/gradient/
 * `transparent` forms as-is, prefix bare hex with `#`.
 */
export function normalizeColor(
	color: string | undefined,
	opts: NormalizeColorOptions = {},
): string | undefined {
	if (!color) return undefined;
	const trimmed = color.trim();
	if (!trimmed) return undefined;
	if (
		trimmed.startsWith("#") ||
		trimmed.includes(",") ||
		trimmed === "transparent" ||
		(opts.allowUrl && trimmed.startsWith("url(")) ||
		(opts.allowNamed && /^[a-zA-Z]+$/.test(trimmed))
	) {
		return trimmed;
	}
	if (/^[0-9a-fA-F]{3,8}$/.test(trimmed)) {
		return `#${trimmed}`;
	}
	return trimmed;
}

/**
 * Resolve one widget property through the standard fallback chain:
 * selected override → selected tokens (in order) → fallback override →
 * fallback tokens (in order). Each candidate passes through `format`.
 */
export function resolveWithFallback(
	selectedOverride: Record<string, string | undefined>,
	selectedColors: ThemeColors | undefined,
	fallbackOverride: Record<string, string | undefined>,
	fallbackColors: ThemeColors | undefined,
	overrideKey: string,
	colorTokens: (keyof ThemeColors)[],
	format: (value: string | undefined) => string | undefined,
): string | undefined {
	if (selectedOverride[overrideKey]) {
		return format(selectedOverride[overrideKey]);
	}
	for (const tok of colorTokens) {
		const hex = tokenHex(selectedColors, tok);
		if (hex) return format(hex);
	}
	if (fallbackOverride[overrideKey]) {
		return format(fallbackOverride[overrideKey]);
	}
	for (const tok of colorTokens) {
		const hex = tokenHex(fallbackColors, tok);
		if (hex) return format(hex);
	}
	return undefined;
}
