// TypeScript type checking disabled - Vercel query params are string | string[] but functions expect string
// @ts-nocheck

import { renderRepoCard } from "../src/cards/repo.ts";
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
import { parseBoolean } from "../src/common/utils.ts";
import { fetchRepo } from "../src/fetchers/repo.ts";

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
		repo,
		hide_border,
		title_color,
		icon_color,
		text_color,
		bg_color,
		theme,
		show_owner,
		cache_seconds,
		locale,
		border_radius,
		border_color,
		description_lines_count,
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
		const repoData = await fetchRepo(username, repo);
		const cacheSeconds = resolveCacheSeconds({
			requested: parseInt(cache_seconds, 10),
			def: CACHE_TTL.PIN_CARD.DEFAULT,
			min: CACHE_TTL.PIN_CARD.MIN,
			max: CACHE_TTL.PIN_CARD.MAX,
		});

		setCacheHeaders(res, cacheSeconds);

		return res.send(
			renderRepoCard(repoData, {
				hide_border: parseBoolean(hide_border),
				title_color,
				icon_color,
				text_color,
				bg_color,
				theme,
				border_radius,
				border_color,
				show_owner: parseBoolean(show_owner),
				locale: locale ? locale.toLowerCase() : null,
				description_lines_count,
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
