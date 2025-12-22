import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendErrorSvg } from "../lib/errors.js";
import { filterThemeParam, getUsername } from "../lib/params.js";

import {
	computeEtag,
	resolveCacheSeconds,
	setCacheHeaders,
	setEtagAndMaybeSend304,
	setSvgHeaders,
	writeTrophyCacheWithMeta,
} from "./_utils.js";
import renderer from "./trophy-renderer-static.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		const proto = (req.headers["x-forwarded-proto"] || "https").toString();
		const host = (req.headers.host || "localhost").toString();
		const url = new URL(req.url as string, `${proto}://${host}`);
		const username = getUsername(url, ["username"]);
		if (!username) {
			return sendErrorSvg(
				req,
				res,
				"Missing or invalid ?username=...",
				"UNKNOWN",
			);
		}

		// upstream proxying removed — always use local TypeScript renderer.

		// Always use local TypeScript renderer.
		filterThemeParam(url);
		const theme = (url.searchParams.get("theme") || "").toLowerCase();
		const title = url.searchParams.get("title") || undefined;
		const columns = parseInt(url.searchParams.get("columns") || "4", 10) || 4;

		let svgOut: string;
		try {
			svgOut = await renderer({ username, theme, title, columns });
		} catch (err: unknown) {
			try {
				console.error(
					"trophy: renderer threw",
					err instanceof Error ? err.message : String(err),
					err instanceof Error ? err.stack : undefined,
				);
			} catch {}
			return sendErrorSvg(
				req,
				res,
				"Trophy renderer not available",
				"TROPHY_INTERNAL",
			);
		}

		const cacheSeconds = resolveCacheSeconds(
			url,
			["TROPHY_CACHE_SECONDS", "CACHE_SECONDS"],
			86400,
		);
		setSvgHeaders(res);
		setCacheHeaders(res, cacheSeconds);

		// Persist cache for future fallbacks (best-effort).
		try {
			let etag: string | undefined;
			try {
				etag =
					typeof computeEtag === "function" ? computeEtag(svgOut) : undefined;
			} catch {
				etag = undefined;
			}
			const internalTTL = Math.max(cacheSeconds, 259200);
			try {
				await writeTrophyCacheWithMeta(
					url.toString(),
					svgOut,
					etag ?? "",
					internalTTL,
				);
			} catch {
				// ignore
			}
		} catch {}

		if (
			setEtagAndMaybeSend304(
				req.headers as Record<string, unknown>,
				res,
				svgOut,
			)
		) {
			res.status(200);
			return res.send(svgOut);
		}
		return res.send(svgOut);
	} catch (_err) {
		return sendErrorSvg(req, res, "trophy: internal error", "TROPHY_INTERNAL");
	}
}
