import { renderStatsCard } from "../src/cards/stats.js";
import type { StatCardOptions } from "../src/cards/types.d.ts";
import { guardAccess } from "../src/common/access.ts";
import {
	CACHE_TTL,
	resolveCacheSeconds,
	setCacheHeaders,
	setErrorCacheHeaders,
} from "../src/common/cache.ts";
import { parseArray, parseBoolean, renderError } from "../src/common/utils.ts";
import { fetchStats } from "../src/fetchers/stats.ts";
import { isLocaleAvailable } from "../src/translations.js";

export default async function handler(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const q = Object.fromEntries(url.searchParams.entries()) as Record<
		string,
		string
	>;

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
	} = q;

	// Minimal res shim used by existing helpers (guardAccess expects res.send)
	type ResShim = {
		headers: Map<string, string>;
		setHeader: (k: string, v: string) => void;
		send: (body: string) => Response;
	};
	const resShim: ResShim = {
		headers: new Map<string, string>(),
		setHeader(k: string, v: string) {
			this.headers.set(k, v);
		},
		send(body: string) {
			return new Response(body, { headers: Object.fromEntries(this.headers) });
		},
	} as ResShim;

	// Ensure SVG content-type by default so successful renders embed properly
	resShim.setHeader("Content-Type", "image/svg+xml");

	if (!username) {
		return new Response(
			renderError({ message: "Missing required parameter: username" }),
			{
				headers: new Headers({ "Content-Type": "image/svg+xml" }),
				status: 400,
			},
		);
	}

	const access = guardAccess({
		res: resShim,
		id: username,
		type: "username",
		colors: { title_color, text_color, bg_color, border_color, theme },
	});
	if (access.isPassed === false) return access.result;

	if (locale && !isLocaleAvailable(locale)) {
		return new Response(
			renderError({
				message: "Something went wrong",
				secondaryMessage: "Language not found",
				renderOptions: {
					title_color,
					text_color,
					bg_color,
					border_color,
					theme,
				},
			}),
			{ headers: new Headers({ "Content-Type": "image/svg+xml" }) },
		);
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
			parseInt(String(commits_year || "0"), 10),
		);

		const cacheSeconds = resolveCacheSeconds({
			requested: parseInt(String(cache_seconds || "0"), 10),
			def: CACHE_TTL.STATS_CARD.DEFAULT,
			min: CACHE_TTL.STATS_CARD.MIN,
			max: CACHE_TTL.STATS_CARD.MAX,
		});

		setCacheHeaders(resShim, cacheSeconds);

		return resShim.send(
			renderStatsCard(stats, {
				hide: parseArray(hide),
				show_icons: parseBoolean(show_icons),
				hide_title: parseBoolean(hide_title),
				hide_border: parseBoolean(hide_border),
				card_width: parseInt(String(card_width || "0"), 10) || undefined,
				hide_rank: parseBoolean(hide_rank),
				include_all_commits: parseBoolean(include_all_commits),
				commits_year: parseInt(String(commits_year || "0"), 10) || undefined,
				line_height,
				title_color,
				ring_color,
				icon_color,
				text_color,
				text_bold: parseBoolean(text_bold),
				bg_color,
				theme: theme as unknown as string | undefined,
				custom_title,
				border_radius: parseInt(String(border_radius || "0"), 10) || undefined,
				border_color,
				number_format,
				locale: locale ? locale.toLowerCase() : undefined,
				disable_animations: parseBoolean(disable_animations),
				rank_icon,
				show: showStats,
			} as Partial<StatCardOptions>),
		);
	} catch (err: unknown) {
		setErrorCacheHeaders(resShim);
		const e = err as { message?: string; secondaryMessage?: string };
		return new Response(
			renderError({
				message: e.message ?? "Something went wrong",
				secondaryMessage: e.secondaryMessage,
				renderOptions: {
					title_color,
					text_color,
					bg_color,
					border_color,
					theme: theme as unknown as string | undefined,
				},
			}),
			{ headers: new Headers({ "Content-Type": "image/svg+xml" }) },
		);
	}
}
