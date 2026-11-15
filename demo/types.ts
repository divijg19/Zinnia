/**
 * The shapes the demo page works with.
 *
 * The demo renders the cards the generator prerendered, so its theme entries
 * are the *generated registry's* shape - not the canonical registry's
 * definition, which the build-time renderers consume.
 */

/** A prerendered card: where it lives and how big it is. */
export type DemoAsset = {
	src?: string;
	width?: number;
	height?: number;
};

/** The colour tokens a theme entry carries in the generated registry. */
export type DemoThemeColors = {
	background?: { hex?: string };
	css?: string;
	[key: string]: unknown;
};

/** One theme in the generated registry. */
export type DemoTheme = {
	name: string;
	displayName?: string;
	previewColors?: string[];
	colors?: DemoThemeColors;
	widgets?: Record<string, DemoAsset>;
};

/** A theme name that resolves to another theme at runtime. */
export type DemoAlias = {
	theme: string;
	normalized: string;
	note: string;
};

/** The generated registry the demo page loads. */
export type DemoRegistry = {
	themes: DemoTheme[];
	aliases?: DemoAlias[];
};

/** The page theme the demo chrome itself uses. */
export type PageTheme = "light" | "dark";
