// @ts-nocheck
import type { Theme } from "../theme/_theme.js";
import catppuccinMocha from "../theme/catppuccin-mocha.js";
import chartreuse from "../theme/chartreuse.js";
import dark from "../theme/dark.js";
import forest from "../theme/forest.js";
import light from "../theme/light.js";
import nord from "../theme/nord.js";
import radical from "../theme/radical.js";
import transparent from "../theme/transparent.js";
import unicorn from "../theme/unicorn.js";
import watchdog from "../theme/watchdog.js";
import wtf from "../theme/wtf.js";
import type { Extension, Item } from "../types.js";

export const supported: Record<string, Theme> = {
	dark,
	forest,
	light,
	nord,
	unicorn,
	wtf,
	transparent,
	radical,
	chartreuse,
	catppuccinMocha,
	watchdog,
};

export function ThemeExtension(): Extension {
	return async function Theme(generator, _data, body, styles) {
		if (!generator.config?.theme) {
			return;
		}

		if (
			typeof generator.config.theme === "string" &&
			supported[generator.config.theme]
		) {
			const theme = supported[generator.config.theme];
			styles.push(css(theme));
			if (theme.extends) {
				body["theme-ext"] = () => theme.extends as Item;
			}
		}

		// Type guard for theme config object with light/dark keys
		const themeConfig = generator.config.theme;
		if (
			themeConfig &&
			typeof themeConfig === "object" &&
			"light" in themeConfig &&
			typeof (themeConfig as any).light === "string" &&
			supported[(themeConfig as any).light]
		) {
			const theme = supported[(themeConfig as any).light];
			styles.push(`@media (prefers-color-scheme: light) {${css(theme)}}`);
			if (theme.extends) {
				body["theme-ext-light"] = () => theme.extends as Item;
			}
		}

		if (
			themeConfig &&
			typeof themeConfig === "object" &&
			"dark" in themeConfig &&
			typeof (themeConfig as any).dark === "string" &&
			supported[(themeConfig as any).dark]
		) {
			const theme = supported[(themeConfig as any).dark];
			styles.push(`@media (prefers-color-scheme: dark) {${css(theme)}}`);
			if (theme.extends) {
				body["theme-ext-dark"] = () => theme.extends as Item;
			}
		}
	};
}

function css(theme: Theme): string {
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
