// @ts-nocheck

import { fetchWithTimeout } from "../../../../../lib/fetch-timeout.js";
import type { Generator } from "../card.js";
import Baloo_2 from "../shims/fonts/Baloo_2.js";
import Milonga from "../shims/fonts/Milonga.js";
import Patrick_Hand from "../shims/fonts/Patrick_Hand.js";
import Ruthie from "../shims/fonts/Ruthie.js";
import Source_Code_Pro from "../shims/fonts/Source_Code_Pro.js";
import type { Extension } from "../types.js";

export const supported: Record<string, { name: string; base64: string }> = {
	baloo_2: Baloo_2,
	milonga: Milonga,
	patrick_hand: Patrick_Hand,
	ruthie: Ruthie,
	source_code_pro: Source_Code_Pro,
};

const remote_base = "https://cdn.jsdelivr.net/gh/JacobLinCool/nano-font@json/";

export async function FontExtension(generator: Generator): Promise<Extension> {
	const config = generator.config;
	let names: string[] = [];
	if (Array.isArray(config.fonts)) {
		names = config.fonts.filter((font) => !supported[font.toLowerCase()]);
	} else if (
		typeof config.font === "string" &&
		!supported[config.font.toLowerCase()]
	) {
		names = [config.font];
	}

	await Promise.all(
		names.map(async (name) => {
			try {
				const url = `${remote_base}${name.replace(/\s+/g, "_")}.json`;
				const cached = await generator.cache?.match(url);
				if (cached) {
					supported[name.toLowerCase()] = await cached.json();
					generator.log(`Loaded cached font ${name}`);
				} else {
					// Decorative font JSON: fail fast (5s); errors stay ignored.
					const res = await fetchWithTimeout(url, undefined, 5000);
					if (res.ok) {
						const data = (await res.clone().json()) as {
							name: string;
							base64: string;
						};
						supported[name.toLowerCase()] = { name, base64: data.base64 };
						generator.log(`loaded remote font "${name}"`);
						generator.cache?.put(url, res);
					} else {
						return;
					}
				}
			} catch {
				// do nothing
			}
		}),
	);

	return async function Font(_generator, _data, _body, styles) {
		if (Array.isArray(config.fonts)) {
			const list = config.fonts.map((font: string) => {
				if (supported[font.toLowerCase()]) {
					return supported[font.toLowerCase()];
				} else {
					return { name: font };
				}
			});
			styles.push(css(list));
		} else if (typeof config.font === "string") {
			const font = supported[config.font.toLowerCase()];

			if (font) {
				styles.push(css([font]));
			} else {
				styles.push(css([{ name: config.font }]));
			}
		}
	};
}

const GENERIC_FAMILIES = new Set([
	"monospace",
	"sans-serif",
	"serif",
	"cursive",
	"fantasy",
]);

/**
 * Build the card's font CSS.
 *
 * `font-family` is a fallback *list*, so a family that was never embedded is
 * skipped and the next entry is used. The bundled shims ship an empty
 * `base64`, so "Baloo_2" is never actually available; declaring it alone (as
 * this used to) left the browser with no stated fallback, and which face it
 * picked varied by platform. Terminating the list with a generic makes the
 * result deterministic, and keeps a real font working once one is embedded.
 */
function css(fonts: { name: string; base64?: string | null }[]): string {
	let face = "";
	const families: string[] = [];
	for (const font of fonts) {
		if (font.base64) {
			face += `@font-face {font-family:"${font.name}";src:url("${font.base64}") format("woff2")}`;
		}
		if (GENERIC_FAMILIES.has(font.name)) families.push(font.name);
		else families.push(`"${font.name}"`);
	}
	if (families.length === 0) return face;
	const last = families[families.length - 1] as string;
	if (!GENERIC_FAMILIES.has(last.replace(/"/g, "")))
		families.push("sans-serif");
	return `${face}*{font-family:${families.join(",")}}`;
}
