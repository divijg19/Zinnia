// Returns themes and available locales for the demo UI
import type { RequestLike, ResponseLike } from "../src/server_types";

export default async function handler(_req: RequestLike, res: ResponseLike) {
	try {
		const tryImport = async (base: string) => {
			try {
				return await import(`${base}.js`);
			} catch (_e) {
				return await import(`${base}.ts`);
			}
		};

		const themesMod = await tryImport("../src/themes");
		const translationsMod = await tryImport("../src/translations");

		const THEMES = themesMod.THEMES ?? themesMod.default ?? themesMod;
		const TRANSLATIONS =
			translationsMod.TRANSLATIONS ??
			translationsMod.default ??
			translationsMod;

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
