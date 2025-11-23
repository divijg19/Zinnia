import { renderStatsCard } from "../src/cards/stats.js";
import type { StatCardOptions } from "../src/cards/types.d.ts";
import { guardAccess } from "../src/common/access.js";
import {
	CACHE_TTL,
	resolveCacheSeconds,
	setCacheHeaders,
	setErrorCacheHeaders,
} from "../src/common/cache.js";
import { parseArray, parseBoolean, renderError } from "../src/common/utils.js";
import { fetchStats } from "../src/fetchers/stats.js";
import { isLocaleAvailable } from "../src/translations.js";

export default async function handler(
	req: Request | any,
	res?: any,
): Promise<any> {
	const rawUrl = (req as any)?.url;
	const safeUrl =
		typeof rawUrl === "string" && rawUrl ? rawUrl : "http://localhost/";
	const url = new URL(safeUrl);
	// Support both Request.url (serverless) and Express-like `req.query` used in tests
	const q =
		req && (req as any).query && Object.keys((req as any).query).length > 0
			? (req as any).query
			: (Object.fromEntries(url.searchParams.entries()) as Record<
				string,
				string
			>);

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

	// Use the caller-provided response shim (tests) when available, otherwise
	// create a local shim that returns a Response (serverless runtime).
	type ResShim = {
		headers: Map<string, string>;
		setHeader: (k: string, v: string) => void;
		send: (body: string, status?: number) => any;
	};

	const externalRes =
		res && typeof res.setHeader === "function" && typeof res.send === "function"
			? res
			: null;

	let resShim: ResShim;
	if (externalRes) {
		resShim = {
			headers: new Map<string, string>(),
			setHeader(k: string, v: string) {
				externalRes.setHeader(k, v);
				this.headers.set(k, v);
			},
			send(body: string, status?: number) {
				if (typeof externalRes.status === "function" && status) {
					externalRes.status(status);
				}
				return externalRes.send(body);
			},
		} as ResShim;
	} else {
		resShim = {
			headers: new Map<string, string>(),
			setHeader(k: string, v: string) {
				this.headers.set(k, v);
			},
			send(body: string, status?: number) {
				// In server runtime global Response should exist; keep behavior.
				// Use the global Response if available.
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const G = globalThis as any as Record<string, any>;
				if (typeof G.Response === "function") {
					return new G.Response(body, {
						headers: Object.fromEntries(this.headers),
						status,
					});
				}
				// If Response is not available (test env), return a plain object.
				return { body, headers: Object.fromEntries(this.headers), status };
			},
		} as ResShim;
	}

	// Ensure SVG content-type by default so successful renders embed properly
	resShim.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
	resShim.setHeader("X-Content-Type-Options", "nosniff");
	resShim.setHeader("Vary", "Accept-Encoding");

	if (!username) {
		return resShim.send(
			renderError({ message: "Missing required parameter: username" }),
			400,
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
		return resShim.send(
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

		const requestedValue =
			"cache_seconds" in q && (q as any).cache_seconds !== undefined
				? parseInt(String(cache_seconds), 10)
				: NaN;
		const cacheSeconds = resolveCacheSeconds({
			requested: requestedValue,
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
		return resShim.send(
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
		);
	}
}
