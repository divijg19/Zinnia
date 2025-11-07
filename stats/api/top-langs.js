// @ts-check

import { renderTopLanguagesCard as renderTopLanguages } from "../src/cards/top-languages.js";
import { guardAccess } from "../src/common/access.js";
import {
	CACHE_TTL,
	resolveCacheSeconds,
	setCacheHeaders,
	setErrorCacheHeaders,
} from "../src/common/cache.js";
import { parseArray, parseBoolean, renderError } from "../src/common/utils.js";
import { fetchTopLanguages } from "../src/fetchers/top-languages.js";
import { isLocaleAvailable } from "../src/translations.js";

/**
 * @typedef {"compact" | "normal" | "donut" | "donut-vertical" | "pie"} TopLangsLayout
 */

/**
 * @typedef {"bytes" | "percentages"} StatsFormat
 */

/**
 * @typedef {Object} TopLangsQuery
 * @property {string} username
 * @property {string=} hide
 * @property {string=} hide_title
 * @property {string=} hide_border
 * @property {string=} card_width
 * @property {string=} title_color
 * @property {string=} text_color
 * @property {string=} bg_color
 * @property {string=} theme
 * @property {string=} cache_seconds
 * @property {TopLangsLayout | string=} layout
 * @property {string=} langs_count
 * @property {string=} exclude_repo
 * @property {string=} size_weight
 * @property {string=} count_weight
 * @property {string=} custom_title
 * @property {string=} locale
 * @property {string=} border_radius
 * @property {string=} border_color
 * @property {string=} disable_animations
 * @property {string=} hide_progress
 * @property {StatsFormat | string=} stats_format
 */

/**
 * @template T
 * @typedef {Object} Request
 * @property {T} query
 */

/**
 * @typedef {Object} Response
 * @property {(name: string, value: string) => void} setHeader
 * @property {(body: string) => any} send
 */

/**
 * @typedef {Object} AccessResult
 * @property {boolean} isPassed
 */

/**
 * @typedef {Error & { secondaryMessage?: string }} ErrorWithSecondary
 */

/**
 * @param {Request<TopLangsQuery>} req
 * @param {Response} res
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
	res.setHeader("Content-Type", "image/svg+xml");

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

	if (locale && !isLocaleAvailable(locale)) {
		return res.send(
			renderError({
				message: "Something went wrong",
				secondaryMessage: "Locale not found",
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

		/**
		 * @param {string|number|undefined|null} v
		 * @returns {number|undefined}
		 */
		const toNum = (v) => {
			if (v === undefined || v === null || v === "") return undefined;
			const n = typeof v === "number" ? v : parseInt(String(v), 10);
			return Number.isNaN(n) ? undefined : n;
		};
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
		setErrorCacheHeaders(res);
		const hasMessage =
			err && typeof err === "object" && "message" in err && err.message;
		const hasSecondary =
			err &&
			typeof err === "object" &&
			"secondaryMessage" in err &&
			err.secondaryMessage;
		const message = hasMessage ? String(err.message) : "Something went wrong";
		const secondaryMessage = hasSecondary
			? String(err.secondaryMessage)
			: undefined;
		return res.send(
			renderError({
				message,
				secondaryMessage,
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
};
