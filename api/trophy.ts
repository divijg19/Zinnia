import fs from "node:fs";
import path from "node:path";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
	describeCacheOutcome,
	getDebugFlag,
	newDiag,
	sendDebugJson,
} from "../lib/debug.js";
import { handleRouteError, sendErrorSvg } from "../lib/errors.js";
import {
	importByPath,
	invokePossibleRequestHandler,
	pickHandlerFromModule,
	resolveCompiledHandler,
} from "../lib/loader/index.js";
import { filterThemeParam, getUsername, safeUrl } from "../lib/params.js";
import {
	markCacheStatus,
	renderCacheKey,
	renderWithFallback,
	ttlForOutcome,
} from "../lib/render-cache.js";
import { getGithubPATForService } from "../lib/tokens.js";
import { resolveCacheSeconds, sendSuccessSvg } from "./_utils.js";

// Ensure static renderer exists before importing to provide a clear error
// renderer will be loaded on-demand per request to ensure errors are visible
let renderer: any;

/**
 * Read an SVG body out of a compiled handler's web `Response`.
 *
 * The compiled renderer may answer with an upstream error status, a stale
 * `Cache-Control`/`ETag`, or nothing at all. All of that is deliberately
 * ignored - only the body is taken, and the route's own cache headers and a
 * freshly computed ETag are what ship - so an upstream failure cannot leak into
 * the embed contract. Returns `null` for an empty body so the caller falls
 * through to the local renderer.
 *
 * The declared media type is *not* forwarded. A `Response` built from a string
 * body defaults to `text/plain`, and relabelling an SVG as anything else is
 * worse than trusting the caller's own type: Camo only proxies image media
 * types, so a mislabelled card renders blank. The card route always sends
 * `image/svg+xml`; the upstream type is echoed as a diagnostic header instead.
 */
async function readSvgFromWebResponse(
	webRes: Response,
): Promise<{ svg: string; headers: Record<string, string> } | null> {
	const body = Buffer.from(await webRes.arrayBuffer()).toString("utf-8");
	if (!body) return null;
	const headers: Record<string, string> = {};
	const upstreamType = webRes.headers.get("content-type");
	if (upstreamType) headers["X-Upstream-Content-Type"] = upstreamType;
	const upstreamStatus = webRes.headers.get("x-upstream-status");
	if (upstreamStatus) headers["X-Upstream-Status"] = upstreamStatus;
	return { svg: body, headers };
}

/**
 * Try the pre-bundled renderer. Returns `null` when it is absent, unusable, or
 * produced nothing usable, so the caller falls back to the local renderer.
 *
 * The compiled module is invoked strictly as a `(request) => Response`
 * producer; `res` is deliberately not handed to it. `invokePossibleRequestHandler`
 * prefers `(req, res)` whenever the function declares two parameters, so passing
 * `res` would let a compiled handler write a body directly - and this route
 * would then *also* fall through to the local renderer and write a second body
 * to the same response. Withholding `res` makes that impossible by construction:
 * a handler that expects to write to the response receives `undefined` and fails,
 * which lands in the catch below and falls through with exactly one send.
 */
async function renderWithCompiledHandler(
	req: VercelRequest,
	url: URL,
): Promise<{ svg: string; headers: Record<string, string> } | null> {
	let foundCompiled: string | null | undefined;
	try {
		foundCompiled =
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
			if (fs.existsSync(alt)) foundCompiled = alt;
		}
	} catch {
		return null;
	}
	if (!foundCompiled) return null;
	const compiled = foundCompiled;

	try {
		const mod = (await importByPath(compiled)) as unknown as Record<
			string,
			unknown
		>;
		if (process.env.LOADER_DEBUG === "1") {
			try {
				console.debug(
					"trophy: using compiled spec ->",
					compiled,
					Object.keys(mod || {}),
				);
			} catch {}
		}
		const picked = pickHandlerFromModule(mod, [
			"default",
			"request",
			"handler",
		]);
		if (!picked || typeof picked.fn !== "function") return null;

		const headers = new Headers();
		for (const [k, v] of Object.entries(req.headers as Record<string, string>))
			if (typeof v === "string") headers.set(k, v);
		const webReq = new Request(url.toString(), {
			method: req.method,
			headers,
		});
		const result = await invokePossibleRequestHandler(
			picked.fn as (...args: unknown[]) => unknown,
			webReq,
		);
		// Anything that is not a web `Response` means the compiled renderer is not
		// usable here. It cannot have written to the response, so falling through
		// to the local renderer is safe.
		if (!result || typeof (result as { text?: unknown }).text !== "function") {
			return null;
		}
		return await readSvgFromWebResponse(result as Response);
	} catch (e) {
		try {
			console.debug("trophy: compiled handler invocation failed", String(e));
		} catch {}
		return null;
	}
}

/** Load (once) and run the local TypeScript renderer. */
async function renderLocally(options: {
	username: string;
	theme: string;
	title?: string;
	columns: number;
	column: number;
	row: number;
	params: URLSearchParams;
}): Promise<string> {
	const { username, theme, title, columns, column, row, params } = options;
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
					console.debug("trophy: candidate missing", cand.join("/"));
					continue;
				}
				console.debug("trophy: trying import", p);
				const mod = (await importByPath(p)) as any;
				// if import succeeded but we couldn't find an export, log keys
				if (mod && !renderer) {
					try {
						console.debug("trophy: imported module keys ->", Object.keys(mod));
					} catch {}
				}
				if (typeof mod === "function") {
					renderer = mod;
				} else if (mod && typeof mod.default === "function") {
					renderer = mod.default;
				} else if (mod && typeof mod.renderLocalTrophy === "function") {
					renderer = async (opts: any) => {
						const token = getGithubPATForService("trophy") || "";
						const localParams =
							opts && opts.params instanceof URLSearchParams
								? new URLSearchParams(opts.params)
								: new URLSearchParams();
						if (opts.title) localParams.set("title", String(opts.title));
						if (opts.theme) localParams.set("theme", String(opts.theme));
						// Prefer explicit layout params when provided; otherwise keep those
						// coming from the embed URL (opts.params).
						if (opts.columns != null)
							localParams.set("columns", String(opts.columns));
						if (opts.column != null)
							localParams.set("column", String(opts.column));
						if (opts.row != null) localParams.set("row", String(opts.row));
						return mod.renderLocalTrophy(opts.username, token, localParams);
					};
				} else if (mod && typeof mod.renderTrophySVG === "function") {
					renderer = async (opts: any) => mod.renderTrophySVG(opts);
				}
				if (renderer) {
					loaded = true;
					console.debug("trophy: renderer loaded from", p);
					break;
				}
			} catch (e) {
				console.error("trophy: failed to import", cand.join("/"), String(e));
			}
		}
		if (!loaded)
			throw new Error("trophy renderer not found or invalid exports");
	}
	const svgOut = await renderer({
		username,
		theme,
		title,
		columns,
		column,
		row,
		params,
	});
	// Never send or persist an empty body: route to the error path so embedders
	// always receive a renderable SVG.
	if (!svgOut) throw new Error("trophy renderer returned empty body");
	return svgOut;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	let debug = false;
	let username: string | undefined;
	const diag = newDiag("trophy");
	try {
		const url = safeUrl(req, "/api/trophy");
		debug = getDebugFlag(url);
		const t0 = Date.now();
		username = getUsername(url, ["username", "user"]) ?? undefined;
		if (!username) {
			if (debug) {
				return sendDebugJson(res, {
					...diag,
					stage: "validation",
					error: "Missing or invalid ?username=...",
					code: "UNKNOWN",
				});
			}
			return sendErrorSvg(
				req,
				res,
				"Missing or invalid ?username=...",
				"UNKNOWN",
			);
		}

		// upstream proxying removed — always use local TypeScript renderer.
		filterThemeParam(url);
		const theme = (url.searchParams.get("theme") || "").toLowerCase();
		const title = url.searchParams.get("title") || undefined;
		const columnsRaw = parseInt(
			url.searchParams.get("columns") || url.searchParams.get("cols") || "-1",
			10,
		);
		const columns =
			Number.isFinite(columnsRaw) && (columnsRaw === -1 || columnsRaw > 0)
				? columnsRaw
				: -1;
		const columnRaw = parseInt(
			url.searchParams.get("column") || String(columns),
			10,
		);
		const column =
			Number.isFinite(columnRaw) && (columnRaw === -1 || columnRaw > 0)
				? columnRaw
				: columns;
		const rowRaw = parseInt(
			url.searchParams.get("row") || url.searchParams.get("rows") || "-1",
			10,
		);
		const row = Number.isFinite(rowRaw) ? rowRaw : -1;
		const params = new URLSearchParams(url.searchParams);

		diag.params = { username, theme };
		diag.validation = {
			username: true,
			// Presence only, never the value — safe to echo in ?debug=1.
			patConfigured: Boolean(getGithubPATForService("trophy")),
		};
		const cacheSeconds = resolveCacheSeconds(
			url,
			["TROPHY_CACHE_SECONDS", "CACHE_SECONDS"],
			86400,
		);
		const cacheKey = renderCacheKey(url);
		diag.cache = { key: cacheKey, ttlSeconds: cacheSeconds };

		const tRender0 = Date.now();
		const timing: Record<string, unknown> = {};
		const outcome = await renderWithFallback({
			service: "trophy",
			cacheKey,
			freshSeconds: cacheSeconds,
			produce: async () => {
				const compiled = await renderWithCompiledHandler(req, url);
				if (compiled) return compiled;
				return {
					svg: await renderLocally({
						username: username as string,
						theme,
						title,
						columns,
						column,
						row,
						params,
					}),
					headers: {},
				};
			},
		});
		if (outcome.status !== "hit") timing.renderMs = Date.now() - tRender0;

		diag.timing = { ...timing, totalMs: Date.now() - t0 };
		diag.cache = {
			...(diag.cache as Record<string, unknown>),
			...describeCacheOutcome(outcome),
		};
		const serveSeconds = ttlForOutcome(outcome, cacheSeconds);
		if (debug) {
			return sendDebugJson(res, {
				...diag,
				ok: true,
				stage: "done",
				render: { bytes: outcome.svg.length, cacheSeconds: serveSeconds },
			});
		}
		for (const [key, value] of Object.entries(outcome.headers)) {
			try {
				res.setHeader(key, value);
			} catch {}
		}
		markCacheStatus(res, outcome.status);
		// Always 200 + full SVG with ETag set (never 304-empty).
		return sendSuccessSvg(res, outcome.svg, serveSeconds);
	} catch (err) {
		return handleRouteError(req, res, err, {
			service: "trophy",
			code: "TROPHY_INTERNAL",
			debug,
			diag,
			username,
		});
	}
}
