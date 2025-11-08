// TypeScript type checking disabled - Vercel query params are string | string[] but functions expect string
// @ts-nocheck

import { renderGistCard } from "../src/cards/gist.js";
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
import { parseBoolean } from "../src/common/utils.js";
import { fetchGist } from "../src/fetchers/gist.js";

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
		id,
		title_color,
		icon_color,
		text_color,
		bg_color,
		theme,
		cache_seconds,
		locale,
		border_radius,
		border_color,
		show_owner,
		hide_border,
	} = req.query;

	setSvgHeaders(res);

	const access = guardAccess({
		res,
		id,
		type: "gist",
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
		const gistData = await fetchGist(id);
		const cacheSeconds = resolveCacheSeconds({
			requested: parseInt(cache_seconds, 10),
			def: CACHE_TTL.GIST_CARD.DEFAULT,
			min: CACHE_TTL.GIST_CARD.MIN,
			max: CACHE_TTL.GIST_CARD.MAX,
		});

		setCacheHeaders(res, cacheSeconds);

		return res.send(
			renderGistCard(gistData, {
				title_color,
				icon_color,
				text_color,
				bg_color,
				theme,
				border_radius,
				border_color,
				locale: locale ? locale.toLowerCase() : null,
				show_owner: parseBoolean(show_owner),
				hide_border: parseBoolean(hide_border),
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
