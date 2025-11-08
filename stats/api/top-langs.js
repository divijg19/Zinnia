// TypeScript type checking disabled - Vercel query params are string | string[] but functions expect string
// @ts-nocheck

import { renderTopLanguagesCard as renderTopLanguages } from "../src/cards/top-languages.js";
import { guardAccess } from "../src/common/access.js";
import {
	handleApiError,
	setSvgHeaders,
	toNum,
	validateLocale,
} from "../src/common/api-utils.js";
import {
	CACHE_TTL,
	resolveCacheSeconds,
	setCacheHeaders,
} from "../src/common/cache.js";
import { parseArray, parseBoolean, renderError } from "../src/common/utils.js";
import { fetchTopLanguages } from "../src/fetchers/top-languages.js";

/**
 * @typedef {import('@vercel/node').VercelRequest} VercelRequest
 * @typedef {import('@vercel/node').VercelResponse} VercelResponse
 */

/**
 * @typedef {"compact" | "normal" | "donut" | "donut-vertical" | "pie"} TopLangsLayout
 */

/**
 * @typedef {"bytes" | "percentages"} StatsFormat
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
		title_color,
		text_color,
		bg_color,
		theme,
		cache_seconds,
		layout,
		langs_count,
		exclude_repo,
		size_weight,
		count_weight,
		custom_title,
		locale,
		border_radius,
		border_color,
		disable_animations,
		hide_progress,
		stats_format,
	} = req.query;
	setSvgHeaders(res);

	/** @type {AccessResult} */
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
		// guardAccess already sent the response; just stop further processing.
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

	if (
		layout !== undefined &&
		(typeof layout !== "string" ||
			!["compact", "normal", "donut", "donut-vertical", "pie"].includes(layout))
	) {
		return res.send(
			renderError({
				message: "Something went wrong",
				secondaryMessage: "Incorrect layout input",
				renderOptions: {
					title_color,
					text_color,
					bg_color,
					border_color,
					theme,
				},
			}),
		);
	}

	if (
		stats_format !== undefined &&
		(typeof stats_format !== "string" ||
			!["bytes", "percentages"].includes(stats_format))
	) {
		return res.send(
			renderError({
				message: "Something went wrong",
				secondaryMessage: "Incorrect stats_format input",
				renderOptions: {
					title_color,
					text_color,
					bg_color,
					border_color,
					theme,
				},
			}),
		);
	}

	try {
		const sizeWeightNum =
			typeof size_weight === "string" && size_weight.trim() !== ""
				? parseFloat(size_weight)
				: undefined;
		const countWeightNum =
			typeof count_weight === "string" && count_weight.trim() !== ""
				? parseFloat(count_weight)
				: undefined;
		const topLangs = await fetchTopLanguages(
			username,
			parseArray(exclude_repo),
			sizeWeightNum,
			countWeightNum,
		);
		// Resolve cache seconds: if parameter missing or not a positive number, use default.
		const requestedCacheSeconds =
			cache_seconds !== undefined && cache_seconds !== ""
				? parseInt(String(cache_seconds), 10)
				: NaN;
		/** @type {number} */
		const cacheSeconds = resolveCacheSeconds({
			requested: requestedCacheSeconds <= 0 ? NaN : requestedCacheSeconds,
			def: CACHE_TTL.TOP_LANGS_CARD.DEFAULT,
			min: CACHE_TTL.TOP_LANGS_CARD.MIN,
			max: CACHE_TTL.TOP_LANGS_CARD.MAX,
		});

		setCacheHeaders(res, cacheSeconds);

		const langsCountNum = toNum(langs_count);
		const borderRadiusNum = toNum(border_radius);
		const cardWidthNum = toNum(card_width);
		/** @type {TopLangsLayout|undefined} */
		const layoutOpt = /** @type {any} */ (layout);
		/** @type {StatsFormat|undefined} */
		const statsFormatOpt = /** @type {any} */ (stats_format);
		return res.send(
			renderTopLanguages(topLangs, {
				custom_title,
				hide_title: parseBoolean(hide_title),
				hide_border: parseBoolean(hide_border),
				card_width: cardWidthNum,
				hide: parseArray(hide),
				title_color,
				text_color,
				bg_color,
				// theme union from upstream; treat as any string here
				/** @type {any} */ theme,
				layout: layoutOpt,
				langs_count: langsCountNum,
				border_radius: borderRadiusNum,
				border_color,
				locale: locale ? locale.toLowerCase() : undefined,
				disable_animations: parseBoolean(disable_animations),
				hide_progress: parseBoolean(hide_progress),
				stats_format: statsFormatOpt,
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
