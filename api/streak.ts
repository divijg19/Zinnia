//

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendErrorSvg } from "../lib/errors.js";
import { getUsername } from "../lib/params.js";

// renderer will be loaded from an API-local build folder at runtime; fall back to
// package src/dist during development. We dynamically import to avoid static
// resolution failures in serverless bundles.
type StreakRenderer = (
	user: string,
	params: Record<string, string>,
) => Promise<{ status?: number; body: string | Buffer; contentType: string }>;
let _renderForUser: StreakRenderer | undefined;

async function loadStreakRenderer(): Promise<StreakRenderer> {
	if (_renderForUser) return _renderForUser;
	try {
		const loader = await import("../lib/canonical/loader");
		const fn = await loader.loadStreakRenderer();
		_renderForUser = fn as StreakRenderer;
		return _renderForUser;
	} catch (e) {
		// If the centralized loader fails, surface diagnostic and rethrow so
		// existing callers fall back to upstream or error SVGs as before.
		console.warn(
			"streak: centralized loader failed",
			e instanceof Error ? e.message : String(e),
		);
		throw e;
	}
}

import {
	getCacheAdapterForService,
	resolveCacheSeconds,
	setCacheHeaders,
	setEtagAndMaybeSend304,
	setFallbackCacheHeaders,
	setShortCacheHeaders,
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

		// Try upstream first (tests mock global fetch). If upstream succeeds
		// with an SVG payload, forward it; otherwise fall back to the local
		// TypeScript renderer for generation/cached fallback.
		let upstreamFailed = false;
		try {
			const upstream = new URL("https://zinnia-rho.vercel.app/");
			for (const [k, v] of url.searchParams) upstream.searchParams.set(k, v);
			upstream.searchParams.set("user", user as string);
			const resp = await fetch(upstream.toString());
			const ct = resp?.headers?.get
				? resp.headers.get("content-type")
				: undefined;
			if (
				resp &&
				resp.status >= 200 &&
				resp.status < 300 &&
				ct &&
				ct.includes("svg")
			) {
				const body = await resp.text();
				// Honor If-None-Match via helper which sets ETag header.
				try {
					if (
						setEtagAndMaybeSend304(
							req.headers as Record<string, unknown>,
							res,
							String(body),
						)
					) {
						// Caller expects a 304 match to result in an empty body send.
						return res.send("");
					}
				} catch { }
				setSvgHeaders(res);
				setCacheHeaders(
					res,
					resolveCacheSeconds(
						url,
						["STREAK_CACHE_SECONDS", "CACHE_SECONDS"],
						86400,
					),
				);
				res.setHeader("X-Upstream-Status", String(resp.status));
				return res.send(body);
			}
			// If upstream returned a successful but non-SVG payload, treat as an error
			// and respond with a standardized error SVG (tests accept this path).
			if (
				resp &&
				resp.status >= 200 &&
				resp.status < 300 &&
				(!ct || !ct.includes("svg"))
			) {
				return sendErrorSvg(
					req as VercelRequest,
					res,
					`Upstream streak returned ${resp.status}`,
					"STREAK_UPSTREAM_STATUS",
				);
			}
			// If upstream returned a non-OK but SVG we still forward with transient cache
			if (resp && resp.status >= 400 && ct && ct.includes("svg")) {
				const body = await resp.text();
				setSvgHeaders(res);
				setShortCacheHeaders(res, 60);
				res.setHeader("X-Upstream-Status", String(resp.status));
				return res.send(body);
			}
			// otherwise, fall through to local renderer below
		} catch {
			// upstream failed — we'll prefer a cached fallback or return
			// a standardized error SVG rather than invoking the heavy local
			// renderer which may perform expensive imports.
			upstreamFailed = true;
		}
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

			// If upstream permanently failed and we have no cached payload,
			// return a standardized error SVG quickly instead of importing
			// the local renderer which can be slow/heavy in tests.
			if (upstreamFailed) {
				return sendErrorSvg(
					req as VercelRequest,
					res,
					"Upstream streak fetch failed",
					"STREAK_UPSTREAM_FETCH",
				);
			}

			const renderer = await loadStreakRenderer();
			if (typeof renderer !== "function") {
				throw new Error("streak renderer not available");
			}
			const out = await renderer(
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
