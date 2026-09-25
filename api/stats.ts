import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createCardHandler } from "../lib/card-handler.js";
import { parseArray, parseBoolean, parseNumber } from "../lib/params.js";
import { renderStatsCard } from "../stats/src/cards/stats.js";
import { fetchStats } from "../stats/src/fetchers/stats.js";

const cardHandler = createCardHandler({
	service: "stats",
	fallbackPath: "/api/stats",
	rateLimitCode: "STATS_RATE_LIMIT",
	internalCode: "STATS_INTERNAL",
	cacheEnvKeys: ["STATS_CACHE_SECONDS", "CACHE_SECONDS"],
	cacheFallbackSeconds: 86400,
	fetchData: async (username, url) => {
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
		return {
			model: await fetchStats(
				username,
				Boolean(include_all_commits),
				exclude_repo,
				Boolean(include_merged_pull_requests),
				Boolean(include_discussions),
				Boolean(include_discussions_answers),
				typeof commits_year === "number" ? Math.trunc(commits_year) : undefined,
			),
			include_all_commits: Boolean(include_all_commits),
			commits_year:
				typeof commits_year === "number" ? Math.trunc(commits_year) : undefined,
		};
	},
	renderSvg: (data, url) => {
		const { model, include_all_commits, commits_year } = data as {
			model: Parameters<typeof renderStatsCard>[0];
			include_all_commits: boolean;
			commits_year: number | undefined;
		};
		return renderStatsCard(model, {
			hide: parseArray(url.searchParams.get("hide") ?? undefined),
			show: parseArray(url.searchParams.get("show") ?? undefined),
			show_icons: parseBoolean(url.searchParams.get("show_icons") ?? undefined),
			hide_title: parseBoolean(url.searchParams.get("hide_title") ?? undefined),
			hide_border: parseBoolean(
				url.searchParams.get("hide_border") ?? undefined,
			),
			hide_rank: parseBoolean(url.searchParams.get("hide_rank") ?? undefined),
			include_all_commits,
			commits_year,
			custom_title: url.searchParams.get("custom_title") ?? undefined,
			// Stats renderer uses a narrow theme union; accept any user-provided theme.
			theme: (url.searchParams.get("theme") ?? "default") as any,
			locale: url.searchParams.get("locale") ?? undefined,
			card_width: parseNumber(url.searchParams.get("card_width") ?? undefined),
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
	},
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
	return cardHandler(req, res);
}
