import fs from "node:fs";
import path from "node:path";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendErrorSvg } from "../lib/errors.js";
import { forwardWebResponseToVercel } from "../lib/http.js";
import {
	importByPath,
	invokePossibleRequestHandler,
	pickHandlerFromModule,
	resolveCompiledHandler,
} from "../lib/loader/index.js";
import { filterThemeParam, getUsername } from "../lib/params.js";
import { getGithubPATForService } from "../lib/tokens.js";
import {
	resolveCacheSeconds,
	setCacheHeaders,
	setEtagAndMaybeSend304,
	setShortCacheHeaders,
	setSvgHeaders,
} from "./_utils.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		const pat = getGithubPATForService("stats");
		// Ensure compiled stats API exists before attempting to import it.
		let found = resolveCompiledHandler(
			import.meta.url,
			"..",
			"stats",
			"api",
			"index.js",
		);
		if (!found) {
			const alt = path.join(process.cwd(), "stats", "api", "index.js");
			if (fs.existsSync(alt)) {
				if (process.env.LOADER_DEBUG === "1")
					console.debug("stats: using cwd fallback ->", alt);
				found = alt;
			}
		}
		if (!found) {
			return sendErrorSvg(
				req,
				res,
				"Missing compiled stats API (run build)",
				"STATS_BUILD_MISSING",
			);
		}
		if (!pat) {
			return sendErrorSvg(
				req,
				res,
				"Set PAT_1 in Vercel for stats",
				"STATS_RATE_LIMIT",
			);
		}

		// Ensure compiled module sees the PAT at import time (some modules
		// read process.env.GITHUB_TOKEN during initialization). We restore
		// the original value after invocation in the finally block below.
		const prevGithubToken = process.env.GITHUB_TOKEN;
		if (pat) process.env.GITHUB_TOKEN = String(pat);

		const mod = (await importByPath(found)) as unknown as Record<
			string,
			unknown
		>;
		if (process.env.LOADER_DEBUG === "1") {
			try {
				console.debug("stats: imported module keys ->", Object.keys(mod || {}));
			} catch { }
			console.debug("stats: using compiled spec ->", found);
		}

		const proto = (req.headers["x-forwarded-proto"] || "https").toString();
		const host = (req.headers.host || "localhost").toString();
		const urlForHandler = new URL(
			(req.url as string) || "/api/stats",
			`${proto}://${host}`,
		);

		const picked = pickHandlerFromModule(mod, [
			"default",
			"request",
			"handler",
		]);
		if (!picked || typeof picked.fn !== "function") {
			// Attempt to call renderer-style exports as a fallback (renderStatsCard, renderStats, renderTopLanguages)
			try {
				const url = urlForHandler;
				const username = getUsername(url, ["username", "user"]);
				if (!username)
					return sendErrorSvg(
						req,
						res,
						"Missing or invalid ?username=",
						"UNKNOWN",
					);
				filterThemeParam(url);
				const token = getGithubPATForService("stats") || "";
				const paramsObj = Object.fromEntries(url.searchParams.entries());

				const rendererCandidates = [
					(mod as any).renderStatsCard,
					(mod as any).renderStats,
					(mod as any).renderTopLanguages,
					(mod as any).renderTopLangs,
				];

				for (const fn of rendererCandidates) {
					if (typeof fn !== "function") continue;
					const shapes = [
						() => fn({ username, token, params: paramsObj }),
						() => fn(username, token, paramsObj),
						() => fn(username, token),
						() => fn(username),
						() => fn({ username, ...paramsObj }),
					];
					for (const s of shapes) {
						try {
							const out = await s();
							let body: string | undefined;
							let status = 200;
							let contentType = "image/svg+xml";
							if (!out) continue;
							if (typeof out === "string") body = out;
							else if (typeof out === "object") {
								if (typeof out.body === "string") body = out.body;
								if (typeof out.status === "number") status = out.status;
								if (typeof out.contentType === "string")
									contentType = out.contentType;
							}
							if (!body) continue;
							setSvgHeaders(res);
							// determine cache seconds and apply
							const cacheSeconds = resolveCacheSeconds(
								url,
								["STATS_CACHE_SECONDS", "CACHE_SECONDS"],
								86400,
							);
							if (status >= 500) {
								setShortCacheHeaders(res, Math.min(cacheSeconds, 60));
								res.setHeader("X-Cache-Status", "transient");
							} else {
								setCacheHeaders(res, cacheSeconds);
							}
							if (contentType)
								try {
									res.setHeader("Content-Type", contentType);
								} catch { }
							res.status(status);
							if (
								setEtagAndMaybeSend304(
									req.headers as Record<string, unknown>,
									res,
									body,
								)
							) {
								res.status(200);
								return res.send(body);
							}
							return res.send(body);
						} catch { }
					}
				}
			} catch {
				// fallthrough to error response below
			}

			return sendErrorSvg(
				req,
				res,
				"Missing stats request handler export",
				"STATS_INTERNAL",
			);
		}
		const headersForHandler = new Headers();
		for (const [k, v] of Object.entries(
			req.headers as Record<string, string>,
		)) {
			if (typeof v === "string") headersForHandler.set(k, v);
		}
		// Ensure compiled handler sees an Authorization header when we have a PAT
		try {
			if (!headersForHandler.has("authorization") && pat) {
				headersForHandler.set("authorization", `token ${pat}`);
				if (process.env.TOKENS_DEBUG === "1")
					console.debug("stats: injected Authorization header for compiled handler using PAT_? (masked)");
			}
		} catch (e) {
			// ignore header injection failures
		}
		const webReq = new Request(urlForHandler.toString(), {
			method: req.method,
			headers: headersForHandler,
		});

		try {
			const result = await invokePossibleRequestHandler(
				picked.fn as (...args: unknown[]) => unknown,
				webReq,
				res,
			);
			if (result && typeof (result as any).text === "function") {
				const webRes = result as Response;
				try {
					return await forwardWebResponseToVercel(res, webRes);
				} catch (err) {
					console.debug(
						"stats: forwarding compiled handler response failed:",
						String(err),
					);
					return sendErrorSvg(
						req,
						res,
						"stats: internal error",
						"STATS_INTERNAL",
					);
				}
			}
			// Otherwise assume the compiled handler wrote directly to `res` (Vercel-style)
			return null;
		} catch (err) {
			try {
				// Surface axios-like response details when available to aid debugging
				// without leaking tokens.
				const respStatus = (err as any)?.response?.status;
				const respHeaders = (err as any)?.response?.headers;
				let respData: string | undefined;
				if (typeof (err as any)?.response?.data === "string") respData = (err as any).response.data.slice(0, 1024);
				else if ((err as any)?.response?.data) {
					try {
						respData = JSON.stringify((err as any).response.data).slice(0, 1024);
					} catch (_e) {
						respData = String((err as any).response.data).slice(0, 1024);
					}
				}
				console.error("stats: compiled handler invocation failed", {
					message: err instanceof Error ? err.message : String(err),
					stack: err instanceof Error ? err.stack : undefined,
					responseStatus: respStatus,
					responseHeaders: respHeaders,
					responseDataPreview: respData,
				});
			} catch (_e) {
				console.error("stats: compiled handler invocation failed (no extra data)", String(err));
			}
			return sendErrorSvg(req, res, "stats: internal error", "STATS_INTERNAL");
		} finally {
			// restore original env
			try {
				if (typeof prevGithubToken === "undefined") delete process.env.GITHUB_TOKEN;
				else process.env.GITHUB_TOKEN = prevGithubToken as string;
			} catch (_e) { }
		}
	} catch (_err) {
		return sendErrorSvg(req, res, "stats: internal error", "STATS_INTERNAL");
	}
}
