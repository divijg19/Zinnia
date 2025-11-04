import { renderGistCard } from "../src/cards/gist.js";
import { guardAccess } from "../src/common/access.js";
import {
	CACHE_TTL,
	resolveCacheSeconds,
	setCacheHeaders,
	setErrorCacheHeaders,
} from "../src/common/cache.js";
import { parseBoolean, renderError } from "../src/common/utils.js";
import { fetchGist } from "../src/fetchers/gist.ts";
import { isLocaleAvailable } from "../src/translations.js";

export default async function handler(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const q = Object.fromEntries(url.searchParams.entries()) as Record<
		string,
		string
	>;

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
	} = q;

	// guardAccess expects res-like object; use a minimal shim
	type ResShim = {
		headers: Map<string, string>;
		setHeader(k: string, v: string): void;
		send(body: string): Response;
	};
	const resShim: ResShim = {
		headers: new Map<string, string>(),
		setHeader(k: string, v: string) {
			this.headers.set(k, v);
		},
		send(body: string) {
			return new Response(body, { headers: Object.fromEntries(this.headers) });
		},
	};

	if (!id) {
		return new Response(
			renderError({ message: "Missing required parameter: id" }),
			{
				headers: new Headers({ "Content-Type": "image/svg+xml" }),
				status: 400,
			},
		);
	}

	const access = guardAccess({
		res: resShim,
		id,
		type: "gist",
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
		const gistData = await fetchGist(String(id));
		const cacheSeconds = resolveCacheSeconds({
			requested: parseInt(String(cache_seconds || "0"), 10),
			def: CACHE_TTL.GIST_CARD.DEFAULT,
			min: CACHE_TTL.GIST_CARD.MIN,
			max: CACHE_TTL.GIST_CARD.MAX,
		});

		setCacheHeaders(resShim, cacheSeconds);

		return new Response(
			renderGistCard(gistData, {
				title_color,
				icon_color,
				text_color,
				bg_color,
				theme: theme as any,
				border_radius: border_radius ? Number(border_radius) : undefined,
				border_color,
				locale: locale ? locale.toLowerCase() : undefined,
				show_owner: parseBoolean(show_owner),
				hide_border: parseBoolean(hide_border),
			} as any),
			{ headers: new Headers({ "Content-Type": "image/svg+xml" }) },
		);
	} catch (err: unknown) {
		setErrorCacheHeaders(resShim);
		const e = err as { message?: string; secondaryMessage?: string };
		return new Response(
			renderError({
				message: e.message || String(err),
				secondaryMessage: e.secondaryMessage || "",
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
}
