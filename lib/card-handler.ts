import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
	describeCacheOutcome,
	getDebugFlag,
	newDiag,
	sendDebugJson,
} from "./debug.js";
import {
	ERR_MISSING_USERNAME,
	type ErrorCode,
	emptyRenderer,
	handleRouteError,
	missingUsername,
	sendErrorSvg,
} from "./errors.js";
import {
	filterThemeParam,
	getUsername,
	resolveCacheSeconds,
	safeUrl,
	sendSuccessSvg,
} from "./params.js";
import {
	getCachedRender,
	markCacheStatus,
	renderCacheKey,
	renderWithFallback,
	STALE_SERVE_SECONDS,
	ttlForOutcome,
} from "./render-cache.js";
import { hasAnyPatEnv, seedServicePat, withPatEnv } from "./tokens.js";

/**
 * Service plugs for {@link createCardHandler}. `fetchData` parses the
 * service's fetch params from the URL and returns the fetched model;
 * `renderSvg` parses the service's render options and returns the SVG.
 * Everything else — validation, PAT bootstrap, diagnostics, caching,
 * the always-200 contract — is shared.
 */
export type CardServiceConfig = {
	service: string;
	fallbackPath: string;
	rateLimitCode: ErrorCode;
	internalCode: ErrorCode;
	cacheEnvKeys: [string, string];
	cacheFallbackSeconds: number;
	fetchData: (username: string, url: URL) => Promise<unknown>;
	/**
	 * Optional pre-render step: parse render-only options, extend `diag`
	 * (e.g. top-langs records the resolved layout), and return a bag passed
	 * through to `renderSvg` so options are parsed exactly once.
	 */
	prepareRender?: (
		url: URL,
		diag: Record<string, unknown>,
	) => Record<string, unknown>;
	renderSvg: (
		data: unknown,
		url: URL,
		prepared?: Record<string, unknown>,
	) => string;
};

/**
 * Build a card route handler from service plugs. The produced handler is
 * behavior-identical to the historical per-route implementations: the same
 * validation order, the same PAT bootstrap, the same debug/diagnostic
 * shape, and the same always-200 + ETag response contract.
 *
 * On top of that it serves the shared render cache, so a card whose TTL has
 * expired is answered from the previous render instead of re-running the fetch,
 * and a fetch that fails or overruns its deadline falls back to that same
 * previous render rather than to an error card.
 */
export function createCardHandler(
	cfg: CardServiceConfig,
): (req: VercelRequest, res: VercelResponse) => Promise<unknown> {
	return async function handler(req: VercelRequest, res: VercelResponse) {
		let debug = false;
		let username: string | undefined;
		let diag = newDiag(cfg.service);
		return withPatEnv(async () => {
			try {
				const url = safeUrl(req, cfg.fallbackPath);
				debug = getDebugFlag(url);
				const t0 = Date.now();
				diag = newDiag(cfg.service);
				username = getUsername(url, ["username", "user"]);
				if (!username) {
					if (debug) {
						return sendDebugJson(res, {
							...diag,
							stage: "validation",
							error: ERR_MISSING_USERNAME,
							code: "UNKNOWN",
						});
					}
					return missingUsername(req, res);
				}
				filterThemeParam(url);

				seedServicePat(cfg.service, req);

				// PAT presence only — never values. Safe to expose in ?debug=1.
				const patConfigured = hasAnyPatEnv();
				diag.params = {
					username,
					theme: url.searchParams.get("theme") ?? "default",
				};
				diag.validation = { username: true, patConfigured };

				const cacheSeconds = resolveCacheSeconds(
					url,
					cfg.cacheEnvKeys,
					cfg.cacheFallbackSeconds,
				);
				const cacheKey = renderCacheKey(url);
				diag.cache = { key: cacheKey, ttlSeconds: cacheSeconds };
				const cached = await getCachedRender(cfg.service, cacheKey);

				if (!patConfigured) {
					// A deploy without a PAT cannot render, but a README embed
					// should not go blank over it. Serve the last good card - as
					// the trophy route already does - and leave the misconfiguration
					// visible in the logs and in ?debug=1, which still reports the
					// validation failure. The stale TTL is short, so the mistake is
					// re-checked constantly rather than papered over.
					if (cached && !debug) {
						const fresh = Date.now() < cached.freshUntilMs;
						diag.cache = {
							...(diag.cache as Record<string, unknown>),
							status: fresh ? "hit" : "stale",
							ageMs: Date.now() - cached.storedAtMs,
						};
						diag.timing = { totalMs: Date.now() - t0 };
						markCacheStatus(res, fresh ? "hit" : "stale");
						return sendSuccessSvg(
							res,
							cached.svg,
							fresh ? cacheSeconds : STALE_SERVE_SECONDS,
						);
					}
					if (debug) {
						return sendDebugJson(res, {
							...diag,
							stage: "validation",
							error: `Set PAT_1 (or GITHUB_TOKEN) in Vercel for ${cfg.service}`,
							code: cfg.rateLimitCode,
						});
					}
					return sendErrorSvg(
						req,
						res,
						`Set PAT_1 (or GITHUB_TOKEN) in Vercel for ${cfg.service}`,
						cfg.rateLimitCode,
					);
				}

				// Timings are recorded inside the producer, which only runs when
				// this request is the one doing the work. A cache hit therefore
				// reports no fetchMs at all rather than a misleading zero.
				const timing: Record<string, unknown> = {};
				const target = username;
				const outcome = await renderWithFallback({
					service: cfg.service,
					cacheKey,
					freshSeconds: cacheSeconds,
					// The cache lookup above and the one inside are the same read;
					// pass the entry through so it is not repeated.
					preloaded: cached,
					produce: async () => {
						const tFetch0 = Date.now();
						const data = await cfg.fetchData(target, url);
						timing.fetchMs = Date.now() - tFetch0;

						const tRender0 = Date.now();
						const prepared = cfg.prepareRender?.(url, diag);
						const svg = cfg.renderSvg(data, url, prepared);
						// Never send an empty body: route to the error path instead so
						// embedders always receive a renderable SVG.
						if (!svg) emptyRenderer(cfg.service);
						timing.renderMs = Date.now() - tRender0;
						return { svg, headers: {} };
					},
				});

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
			} catch (_err) {
				return handleRouteError(req, res, _err, {
					service: cfg.service,
					code: cfg.internalCode,
					debug,
					diag,
					username,
				});
			}
		});
	};
}
