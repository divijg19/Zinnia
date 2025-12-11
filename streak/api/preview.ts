// Serve a demo preview SVG using the TypeScript demo preview module.

import { setShortCacheHeaders, setSvgHeaders } from "../../api/_utils.js";
import type { RequestLike, ResponseLike } from "../src/server_types";

export default async function handler(req: RequestLike, res: ResponseLike) {
	try {
		const proto = (req.headers["x-forwarded-proto"] || "https").toString();
		const host = (req.headers.host || "localhost").toString();
		const url = new URL(req.url, `${proto}://${host}`);
		const paramsObj = Object.fromEntries(url.searchParams);

		// Try to import built .js module first, fall back to .ts for local dev
		const tryImport = async (base: string) => {
			try {
				return await import(`${base}.js`);
			} catch (_e) {
				return await import(`${base}.ts`);
			}
		};

		const previewMod = await tryImport("../src/demo/preview");
		const gen = previewMod.generateDemoSvg ?? previewMod.default;
		const svg = await gen(paramsObj);

		setSvgHeaders(res);
		// short cache for demo
		setShortCacheHeaders(res, 60);
		res.status(200);
		return res.send(svg);
	} catch (e: unknown) {
		let msg = "preview: internal error";
		if (e instanceof Error) msg = e.message;
		res.setHeader("Content-Type", "text/plain; charset=utf-8");
		res.status(500);
		return res.send(`Error: ${msg}`);
	}
}
