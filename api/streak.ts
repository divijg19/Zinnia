//

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendErrorSvg } from "../lib/errors.js";
import { getUsername } from "../lib/params.js";
import { renderForUser } from "../streak/src/index";
import {
	getCacheAdapterForService,
	resolveCacheSeconds,
	setCacheHeaders,
	setEtagAndMaybeSend304,
	setFallbackCacheHeaders,
	setSvgHeaders,
} from "./_utils.js";
import * as cache from "./cache.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		const proto = (req.headers["x-forwarded-proto"] || "https").toString();
		const host = (req.headers.host || "localhost").toString();
		const url = new URL(req.url as string, `${proto}://${host}`);
		const user = getUsername(url, ["user", "username"]);
		if (!user) {
			return sendErrorSvg(
				req,
				res,
				"Missing or invalid ?user= or ?username=...",
				"UNKNOWN",
			);
		}

		// Always use local TS renderer.
		try {
			const cacheLocal = getCacheAdapterForService("streak");
			const paramsObj = Object.fromEntries(url.searchParams);
			const localKey = `streak:local:${user}:${JSON.stringify(paramsObj)}`;

			try {
				const cached = await cacheLocal.get(localKey);
				if (cached) {
					try {
						const etag = cache.computeEtag
							? cache.computeEtag(cached)
							: undefined;
						if (etag) res.setHeader("ETag", `"${etag}"`);
						if (
							etag &&
							setEtagAndMaybeSend304(
								req.headers as Record<string, unknown>,
								res,
								String(cached),
							)
						) {
							res.status(200);
							return res.send(cached);
						}
					} catch { }
					setSvgHeaders(res);
					setFallbackCacheHeaders(
						res,
						Math.max(
							resolveCacheSeconds(
								url,
								["STREAK_CACHE_SECONDS", "CACHE_SECONDS"],
								86400,
							),
							86400,
						),
					);
					return res.send(cached);
				}
			} catch {
				// ignore cache read errors
			}

			const out = await renderForUser(
				user as string,
				paramsObj as Record<string, string>,
			);
			if (out.status) res.status(out.status);

			const internalTTL = Math.max(
				resolveCacheSeconds(
					url,
					["STREAK_CACHE_SECONDS", "CACHE_SECONDS"],
					86400,
				),
				259200,
			);
			try {
				if (typeof out.body === "string") {
					await cacheLocal.set(localKey, out.body, internalTTL);
				}
			} catch { }

			try {
				const etag = cache.computeEtag(String(out.body));
				if (etag) res.setHeader("ETag", `"${etag}"`);
				if (
					etag &&
					setEtagAndMaybeSend304(
						req.headers as Record<string, unknown>,
						res,
						String(out.body),
					)
				) {
					res.status(200);
					return res.send(String(out.body));
				}
			} catch { }

			res.setHeader("Content-Type", out.contentType);
			if (out.contentType === "image/png") {
				setCacheHeaders(
					res,
					resolveCacheSeconds(
						url,
						["STREAK_CACHE_SECONDS", "CACHE_SECONDS"],
						86400,
					),
				);
				return res.send(out.body as Buffer);
			}
			if (out.contentType === "application/json") {
				setCacheHeaders(
					res,
					resolveCacheSeconds(
						url,
						["STREAK_CACHE_SECONDS", "CACHE_SECONDS"],
						86400,
					),
				);
				return res.send(out.body as string);
			}
			setSvgHeaders(res);
			setCacheHeaders(
				res,
				resolveCacheSeconds(
					url,
					["STREAK_CACHE_SECONDS", "CACHE_SECONDS"],
					86400,
				),
			);
			return res.send(out.body as string);
		} catch (e) {
			console.error("streak: local renderer error", e);
			return sendErrorSvg(
				req,
				res,
				"Streak local renderer failed",
				"STREAK_INTERNAL",
			);
		}
	} catch (_err) {
		return sendErrorSvg(req, res, "streak: internal error", "STREAK_INTERNAL");
	}
}
