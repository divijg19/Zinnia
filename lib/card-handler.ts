import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
	ERR_MISSING_USERNAME,
	type ErrorCode,
	emptyRenderer,
	handleRouteError,
	missingUsername,
	sendDebugJson,
	sendErrorSvg,
} from "./errors.js";
import {
	filterThemeParam,
	getDebugFlag,
	getUsername,
	resolveCacheSeconds,
	safeUrl,
	sendSuccessSvg,
} from "./params.js";
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
 */
export function createCardHandler(
	cfg: CardServiceConfig,
): (req: VercelRequest, res: VercelResponse) => Promise<unknown> {
	return async function handler(req: VercelRequest, res: VercelResponse) {
		let debug = false;
		let diag: Record<string, unknown> = {
			service: cfg.service,
			ok: false,
			stage: "init",
			timing: {},
		};
		return withPatEnv(async () => {
			try {
				const url = safeUrl(req, cfg.fallbackPath);
				debug = getDebugFlag(url);
				const t0 = Date.now();
				diag = {
					service: cfg.service,
					ok: false,
					stage: "init",
					timing: {},
				};
				const username = getUsername(url, ["username", "user"]);
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

				if (!patConfigured) {
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

				const tFetch0 = Date.now();
				const data = await cfg.fetchData(username, url);
				(diag.timing as Record<string, unknown>).fetchMs = Date.now() - tFetch0;

				const tRender0 = Date.now();
				const prepared = cfg.prepareRender?.(url, diag);
				const svg = cfg.renderSvg(data, url, prepared);

				const cacheSeconds = resolveCacheSeconds(
					url,
					cfg.cacheEnvKeys,
					cfg.cacheFallbackSeconds,
				);
				// Never send an empty body: route to the error path instead so
				// embedders always receive a renderable SVG.
				if (!svg) emptyRenderer(cfg.service);
				(diag.timing as Record<string, unknown>).renderMs =
					Date.now() - tRender0;
				(diag.timing as Record<string, unknown>).totalMs = Date.now() - t0;
				if (debug) {
					return sendDebugJson(res, {
						...diag,
						ok: true,
						stage: "done",
						render: { bytes: svg.length, cacheSeconds },
					});
				}
				// Always 200 + full SVG with ETag set (never 304-empty).
				return sendSuccessSvg(res, svg, cacheSeconds);
			} catch (_err) {
				return handleRouteError(req, res, _err, {
					service: cfg.service,
					code: cfg.internalCode,
					debug,
					diag,
				});
			}
		});
	};
}
