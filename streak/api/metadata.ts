// Returns themes and available locales for the demo UI

import { normalizeThemeKeys } from "../../lib/theme-helpers.js";
import { streakThemes } from "../../lib/themes/adapters/streak.js";
import type { RequestLike, ResponseLike } from "../src/server_types";
import { TRANSLATIONS } from "../src/translations.ts";

export default async function handler(_req: RequestLike, res: ResponseLike) {
	try {
		// The theme map comes from the canonical registry through the shared
		// adapter, so the demo and the card agree on every theme.
		const rawThemes = streakThemes();
		const THEMES: Record<string, Record<string, string>> = {};
		try {
			for (const [k, v] of Object.entries(rawThemes || {})) {
				if (v && typeof v === "object") {
					const raw = v as unknown as Record<string, string | undefined>;
					const norm = normalizeThemeKeys(raw);
					// ensure string values for JSON output
					const out: Record<string, string> = {};
					for (const [nk, nv] of Object.entries(norm))
						if (nv !== undefined) out[nk] = String(nv);
					THEMES[k] = out;
				}
			}
		} catch {
			// fallback: expose rawThemes if normalization fails
			Object.assign(THEMES, rawThemes || {});
		}

		const locales = Object.keys(TRANSLATIONS).filter(
			(k) => typeof TRANSLATIONS[k] === "object",
		);

		res.setHeader("Content-Type", "application/json; charset=utf-8");
		res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");
		res.status(200);
		return res.send(JSON.stringify({ themes: THEMES, locales }));
	} catch (e: unknown) {
		let msg = "metadata: internal error";
		if (e instanceof Error) msg = e.message;
		res.setHeader("Content-Type", "text/plain; charset=utf-8");
		res.status(500);
		return res.send(`Error: ${msg}`);
	}
}
