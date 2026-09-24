import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
	ERR_MISSING_USERNAME,
	emptyRenderer,
	handleRouteError,
	missingUsername,
	sendDebugJson,
	sendErrorSvg,
} from "../lib/errors.js";
import {
	filterThemeParam,
	getDebugFlag,
	getUsername,
	parseArray,
	parseBoolean,
	parseNumber,
	safeUrl,
} from "../lib/params.js";
import {
	getGithubPATForService,
	hasAnyPatEnv,
	seedPatFromRequestHeaders,
	withPatEnv,
} from "../lib/tokens.js";
import { renderStatsCard } from "../stats/src/cards/stats.js";
import { fetchStats } from "../stats/src/fetchers/stats.js";
import { resolveCacheSeconds, sendSuccessSvg } from "./_utils.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	let debug = false;
	let diag: Record<string, unknown> = {
		service: "stats",
		ok: false,
		stage: "init",
		timing: {},
	};
	return withPatEnv(async () => {
		try {
			const url = safeUrl(req, "/api/stats");
			debug = getDebugFlag(url);
			const t0 = Date.now();
			diag = {
				service: "stats",
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

			const token = getGithubPATForService("stats");
			try {
				if (
					token &&
					(!process.env.PAT_1 || process.env.PAT_1.trim().length === 0)
				) {
					process.env.PAT_1 = String(token);
				}
			} catch {}
			seedPatFromRequestHeaders(req);

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
						error: "Set PAT_1 (or GITHUB_TOKEN) in Vercel for stats",
						code: "STATS_RATE_LIMIT",
					});
				}
				return sendErrorSvg(
					req,
					res,
					"Set PAT_1 (or GITHUB_TOKEN) in Vercel for stats",
					"STATS_RATE_LIMIT",
				);
			}

			const include_all_commits = parseBoolean(
				url.searchParams.get("include_all_commits") ?? undefined,
			);
			const exclude_repo = parseArray(
				url.searchParams.get("exclude_repo") ?? undefined,
			);
			const include_merged_pull_requests = parseBoolean(
				url.searchParams.get("include_merged_pull_requests") ?? undefined,
			);
			const include_discussions = parseBoolean(
				url.searchParams.get("include_discussions") ?? undefined,
			);
			const include_discussions_answers = parseBoolean(
				url.searchParams.get("include_discussions_answers") ?? undefined,
			);
			const commits_year = parseNumber(
				url.searchParams.get("commits_year") ?? undefined,
			);

			const tFetch0 = Date.now();
			const stats = await fetchStats(
				username,
				Boolean(include_all_commits),
				exclude_repo,
				Boolean(include_merged_pull_requests),
				Boolean(include_discussions),
				Boolean(include_discussions_answers),
				typeof commits_year === "number" ? Math.trunc(commits_year) : undefined,
			);
			(diag.timing as Record<string, unknown>).fetchMs = Date.now() - tFetch0;

			const tRender0 = Date.now();
			const svg = renderStatsCard(stats, {
				hide: parseArray(url.searchParams.get("hide") ?? undefined),
				show: parseArray(url.searchParams.get("show") ?? undefined),
				show_icons: parseBoolean(
					url.searchParams.get("show_icons") ?? undefined,
				),
				hide_title: parseBoolean(
					url.searchParams.get("hide_title") ?? undefined,
				),
				hide_border: parseBoolean(
					url.searchParams.get("hide_border") ?? undefined,
				),
				hide_rank: parseBoolean(url.searchParams.get("hide_rank") ?? undefined),
				include_all_commits: Boolean(include_all_commits),
				commits_year:
					typeof commits_year === "number"
						? Math.trunc(commits_year)
						: undefined,
				custom_title: url.searchParams.get("custom_title") ?? undefined,
				// Stats renderer uses a narrow theme union; accept any user-provided theme.
				theme: (url.searchParams.get("theme") ?? "default") as any,
				locale: url.searchParams.get("locale") ?? undefined,
				card_width: parseNumber(
					url.searchParams.get("card_width") ?? undefined,
				),
				line_height: parseNumber(
					url.searchParams.get("line_height") ?? undefined,
				),
				border_radius: parseNumber(
					url.searchParams.get("border_radius") ?? undefined,
				),
				title_color: url.searchParams.get("title_color") ?? undefined,
				text_color: url.searchParams.get("text_color") ?? undefined,
				icon_color: url.searchParams.get("icon_color") ?? undefined,
				ring_color: url.searchParams.get("ring_color") ?? undefined,
				bg_color: url.searchParams.get("bg_color") ?? undefined,
				border_color: url.searchParams.get("border_color") ?? undefined,
				number_format: url.searchParams.get("number_format") ?? undefined,
				rank_icon: (url.searchParams.get("rank_icon") ?? undefined) as any,
				disable_animations: parseBoolean(
					url.searchParams.get("disable_animations") ?? undefined,
				),
			});

			const cacheSeconds = resolveCacheSeconds(
				url,
				["STATS_CACHE_SECONDS", "CACHE_SECONDS"],
				86400,
			);
			// Never send an empty body: route to the error path instead so
			// embedders always receive a renderable SVG.
			if (!svg) emptyRenderer("stats");
			(diag.timing as Record<string, unknown>).renderMs = Date.now() - tRender0;
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
				service: "stats",
				code: "STATS_INTERNAL",
				debug,
				diag,
			});
		}
	});
}
