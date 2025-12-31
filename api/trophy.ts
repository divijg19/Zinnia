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
	computeEtag,
	resolveCacheSeconds,
	setCacheHeaders,
	setEtagAndMaybeSend304,
	setSvgHeaders,
	writeTrophyCacheWithMeta,
} from "./_utils.js";

// Ensure static renderer exists before importing to provide a clear error
// renderer will be loaded on-demand per request to ensure errors are visible
let renderer: any;

export default async function handler(req: VercelRequest, res: VercelResponse) {
	// Attempt compiled handler first (Vercel build output). If present, invoke and forward.
	try {
		let foundCompiled =
			resolveCompiledHandler(
				import.meta.url,
				"..",
				"api",
				"_build",
				"trophy",
				"renderer.js",
			) ||
			resolveCompiledHandler(import.meta.url, "..", "trophy", "renderer.js") ||
			resolveCompiledHandler(
				import.meta.url,
				"..",
				"trophy-renderer-static.js",
			) ||
			resolveCompiledHandler(import.meta.url, "trophy-renderer-static.js");
		if (!foundCompiled) {
			const alt = path.join(
				process.cwd(),
				"api",
				"_build",
				"trophy",
				"renderer.js",
			);
			if (fs.existsSync(alt)) {
				if (process.env.LOADER_DEBUG === "1")
					console.debug("trophy: using cwd fallback ->", alt);
				foundCompiled = alt;
			}
		}
		if (foundCompiled) {
			try {
				const mod = (await importByPath(foundCompiled)) as unknown as Record<
					string,
					unknown
				>;
				if (process.env.LOADER_DEBUG === "1") {
					try {
						console.debug(
							"trophy: imported compiled keys ->",
							Object.keys(mod || {}),
						);
					} catch { }
					console.debug("trophy: using compiled spec ->", foundCompiled);
				}
				const picked = pickHandlerFromModule(mod, [
					"default",
					"request",
					"handler",
				]);
				if (picked && typeof picked.fn === "function") {
					// Build web Request and invoke
					const proto = (
						req.headers["x-forwarded-proto"] || "https"
					).toString();
					const host = (req.headers.host || "localhost").toString();
					const url = new URL(
						(req.url as string) || "/api/trophy",
						`${proto}://${host}`,
					);
					const headers = new Headers();
					for (const [k, v] of Object.entries(
						req.headers as Record<string, string>,
					))
						if (typeof v === "string") headers.set(k, v);
					const webReq = new Request(url.toString(), {
						method: req.method,
						headers,
					});
					const result = await invokePossibleRequestHandler(
						picked.fn as (...args: unknown[]) => unknown,
						webReq,
						res,
					);
					if (result && typeof (result as any).text === "function") {
						return await forwardWebResponseToVercel(res, result as Response);
					}
					// otherwise assume handler wrote directly to res
					return null;
				}
			} catch (e) {
				try {
					console.debug(
						"trophy: compiled handler invocation failed",
						String(e),
					);
				} catch { }
			}
		}
	} catch { }
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
			if (!renderer) {
				// attempt to load the built renderer now and provide diagnostics
				const candidates = [
					["..", "api", "_build", "trophy", "renderer.js"],
					["..", "trophy", "renderer.js"],
					["..", "trophy-renderer-static.js"],
					["trophy-renderer-static.js"],
				];
				let loaded = false;
				for (const cand of candidates) {
					const p = resolveCompiledHandler(import.meta.url, ...cand);
					try {
						if (!p) {
							// log missing candidate
							// eslint-disable-next-line no-console
							console.debug("trophy: candidate missing", cand.join("/"));
							continue;
						}
						// eslint-disable-next-line no-console
						console.debug("trophy: trying import", p);
						const mod = (await importByPath(p)) as any;
						// if import succeeded but we couldn't find an export, log keys
						if (mod && !renderer) {
							try {
								// eslint-disable-next-line no-console
								console.debug(
									"trophy: imported module keys ->",
									Object.keys(mod),
								);
							} catch { }
						}
						if (typeof mod === "function") {
							renderer = mod;
						} else if (mod && typeof mod.default === "function") {
							renderer = mod.default;
						} else if (mod && typeof mod.renderLocalTrophy === "function") {
							renderer = async (opts: any) => {
								const token = getGithubPATForService("trophy") || "";
								const params = new URLSearchParams();
								if (opts.title) params.set("title", String(opts.title));
								if (opts.columns) params.set("columns", String(opts.columns));
								if (opts.theme) params.set("theme", String(opts.theme));
								return mod.renderLocalTrophy(opts.username, token, params);
							};
						} else if (mod && typeof mod.renderTrophySVG === "function") {
							renderer = async (opts: any) => mod.renderTrophySVG(opts);
						}
						if (renderer) {
							loaded = true;
							// eslint-disable-next-line no-console
							console.debug("trophy: renderer loaded from", p);
							break;
						}
					} catch (e) {
						// eslint-disable-next-line no-console
						console.error(
							"trophy: failed to import",
							cand.join("/"),
							String(e),
						);
					}
				}
				if (!loaded)
					throw new Error("trophy renderer not found or invalid exports");
			}
			svgOut = await renderer({ username, theme, title, columns });
		} catch (err: unknown) {
			try {
				console.error(
					"trophy: renderer threw",
					err instanceof Error ? err.message : String(err),
					err instanceof Error ? err.stack : undefined,
				);
			} catch { }
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
		} catch { }

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
