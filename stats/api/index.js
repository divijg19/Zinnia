// TypeScript type checking disabled - Vercel query params are string | string[] but functions expect string
// @ts-nocheck

import { renderStatsCard } from "../src/cards/stats.ts";
import { guardAccess } from "../src/common/access.js";
import {
	handleApiError,
	setSvgHeaders,
	validateLocale,
} from "../src/common/api-utils.js";
import {
	CACHE_TTL,
	resolveCacheSeconds,
	setCacheHeaders,
} from "../src/common/cache.js";
import { parseArray, parseBoolean } from "../src/common/utils.ts";
import { fetchStats } from "../src/fetchers/stats.ts";

/**
 * @typedef {import('@vercel/node').VercelRequest} VercelRequest
 * @typedef {import('@vercel/node').VercelResponse} VercelResponse
 */

/**
 * @param {VercelRequest} req
 * @param {VercelResponse} res
 */
export default async (req, res) => {
	const {
		username,
		hide,
		hide_title,
		hide_border,
		card_width,
		hide_rank,
		show_icons,
		include_all_commits,
		commits_year,
		line_height,
		title_color,
		ring_color,
		icon_color,
		text_color,
		text_bold,
		bg_color,
		theme,
		cache_seconds,
		exclude_repo,
		custom_title,
		locale,
		disable_animations,
		border_radius,
		number_format,
		border_color,
		rank_icon,
		show,
	} = req.query;
	setSvgHeaders(res);

	const access = guardAccess({
		res,
		id: username,
		type: "username",
		colors: {
			title_color,
			text_color,
			bg_color,
			border_color,
			theme,
		},
	});
	if (!access.isPassed) {
		// guardAccess already wrote the response
		return;
	}

	if (
		validateLocale({
			locale,
			res,
			title_color,
			text_color,
			bg_color,
			border_color,
			theme,
		})
	) {
		return;
	}

	try {
		const showStats = parseArray(show);
		const stats = await fetchStats(
			username,
			parseBoolean(include_all_commits),
			parseArray(exclude_repo),
			showStats.includes("prs_merged") ||
				showStats.includes("prs_merged_percentage"),
			showStats.includes("discussions_started"),
			showStats.includes("discussions_answered"),
			parseInt(commits_year, 10),
		);
		const cacheSeconds = resolveCacheSeconds({
			requested: parseInt(cache_seconds, 10),
			def: CACHE_TTL.STATS_CARD.DEFAULT,
			min: CACHE_TTL.STATS_CARD.MIN,
			max: CACHE_TTL.STATS_CARD.MAX,
		});

		setCacheHeaders(res, cacheSeconds);

		return res.send(
			renderStatsCard(stats, {
				hide: parseArray(hide),
				show_icons: parseBoolean(show_icons),
				hide_title: parseBoolean(hide_title),
				hide_border: parseBoolean(hide_border),
				card_width: parseInt(card_width, 10),
				hide_rank: parseBoolean(hide_rank),
				include_all_commits: parseBoolean(include_all_commits),
				commits_year: parseInt(commits_year, 10),
				line_height,
				title_color,
				ring_color,
				icon_color,
				text_color,
				text_bold: parseBoolean(text_bold),
				bg_color,
				theme,
				custom_title,
				border_radius,
				border_color,
				number_format,
				locale: locale ? locale.toLowerCase() : null,
				disable_animations: parseBoolean(disable_animations),
				rank_icon,
				show: showStats,
			}),
		);
	} catch (err) {
		return handleApiError({
			res,
			err,
			title_color,
			text_color,
			bg_color,
			border_color,
			theme,
		});
	}
};
