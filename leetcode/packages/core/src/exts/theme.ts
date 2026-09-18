import type { LeetCodeThemeProperties } from "@lib/themes";
import { toLeetCodeTheme } from "@lib/themes/adapters/leetcode";
import { themes } from "@lib/themes/registry";
import { THEME_EXTENDS } from "../theme/defs.js";
import type { Extension } from "../types.js";

export const supported: Record<string, LeetCodeThemeProperties> = {};
for (const [name, theme] of Object.entries(themes)) {
	supported[name] = toLeetCodeTheme(theme);
}

function themeExtension(
	name: string,
	body: Record<string, () => unknown>,
	key: string,
): boolean {
	const defs = THEME_EXTENDS[name];
	if (defs) {
		body[key] = () => defs;
		return true;
	}
	return false;
}

function applyTheme(
	name: string,
	body: Record<string, () => unknown>,
	styles: string[],
	prefers?: "light" | "dark",
): void {
	const theme = supported[name];
	if (!theme) {
		return;
	}
	const cssText = css(theme);
	if (prefers) {
		styles.push(`@media (prefers-color-scheme: ${prefers}) {${cssText}}`);
		themeExtension(name, body, `theme-ext-${prefers}`);
	} else {
		styles.push(cssText);
		themeExtension(name, body, "theme-ext");
	}
}

export function ThemeExtension(): Extension {
	return async function Theme(generator, _data, body, styles) {
		const config = generator.config?.theme;
		if (!config) {
			return;
		}

		if (typeof config === "string") {
			applyTheme(config, body, styles);
			return;
		}

		if (typeof config === "object") {
			const themeConfig = config as { light?: unknown; dark?: unknown };
			if (typeof themeConfig.light === "string") {
				applyTheme(themeConfig.light, body, styles, "light");
			}
			if (typeof themeConfig.dark === "string") {
				applyTheme(themeConfig.dark, body, styles, "dark");
			}
		}
	};
}

function css(theme: LeetCodeThemeProperties): string {
	let css = ":root{";
	if (theme.palette.bg) {
		for (let i = 0; i < theme.palette.bg.length; i++) {
			css += `--bg-${i}:${theme.palette.bg[i]};`;
		}
	}
	if (theme.palette.text) {
		for (let i = 0; i < theme.palette.text.length; i++) {
			css += `--text-${i}:${theme.palette.text[i]};`;
		}
	}
	if (theme.palette.color) {
		for (let i = 0; i < theme.palette.color.length; i++) {
			css += `--color-${i}:${theme.palette.color[i]};`;
		}
	}
	css += "}";

	if (theme.palette.bg) {
		css += `#background{fill:var(--bg-0)}`;
		css += `#total-solved-bg{stroke:var(--bg-1)}`;
		css += `#easy-solved-bg{stroke:var(--bg-1)}`;
		css += `#medium-solved-bg{stroke:var(--bg-1)}`;
		css += `#hard-solved-bg{stroke:var(--bg-1)}`;
	}
	if (theme.palette.text) {
		css += `#username{fill:var(--text-0)}`;
		css += `#username-text{fill:var(--text-0)}`;
		css += `#total-solved-text{fill:var(--text-0)}`;
		css += `#easy-solved-type{fill:var(--text-0)}`;
		css += `#medium-solved-type{fill:var(--text-0)}`;
		css += `#hard-solved-type{fill:var(--text-0)}`;
		css += `#ranking{fill:var(--text-1)}`;
		css += `#easy-solved-count{fill:var(--text-1)}`;
		css += `#medium-solved-count{fill:var(--text-1)}`;
		css += `#hard-solved-count{fill:var(--text-1)}`;
	}
	if (theme.palette.color) {
		if (theme.palette.color.length > 0) {
			css += `#total-solved-ring{stroke:var(--color-0)}`;
		}
		if (theme.palette.color.length > 1) {
			css += `#easy-solved-progress{stroke:var(--color-1)}`;
		}
		if (theme.palette.color.length > 2) {
			css += `#medium-solved-progress{stroke:var(--color-2)}`;
		}
		if (theme.palette.color.length > 3) {
			css += `#hard-solved-progress{stroke:var(--color-3)}`;
		}
	}

	css += theme.css || "";

	return css;
}
