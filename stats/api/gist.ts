import { renderGistCard } from "../src/cards/gist.js";
import { guardAccess } from "../src/common/access.js";
import {
	CACHE_TTL,
	resolveCacheSeconds,
	setCacheHeaders,
	setErrorCacheHeaders,
} from "../src/common/cache.js";
import { parseBoolean, renderError } from "../src/common/utils.js";
import { fetchGist } from "../src/fetchers/gist.js";
import { isLocaleAvailable } from "../src/translations.js";

export default async function handler(
	req: Request | unknown,
	res?: unknown,
): Promise<any> {
	const rawUrl = (req as unknown as { url?: string })?.url;
	const safeUrl =
		typeof rawUrl === "string" && rawUrl ? rawUrl : "http://localhost/";
	const url = new URL(safeUrl);
	// Support both Request.url (serverless) and Express-like `req.query` used in tests
	const maybeReqQuery =
		req && (req as unknown as { query?: Record<string, unknown> }).query;
	const q =
		maybeReqQuery && Object.keys(maybeReqQuery).length > 0
			? (maybeReqQuery as Record<string, unknown>)
			: (Object.fromEntries(url.searchParams.entries()) as Record<
				string,
				string
				>);

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

	// guardAccess expects res-like object; use the caller-provided res when
	// available (tests), otherwise create a local shim that returns a
	// Response-like value.
	type ResShim = {
		headers: Map<string, string>;
		setHeader(k: string, v: string): void;
		send(body: string, status?: number): any;
	};

	const externalRes =
		res && typeof res.setHeader === "function" && typeof res.send === "function"
			? res
			: null;

	let resShim: ResShim;
	if (externalRes) {
		// Wrap the provided response so we control how `send` is invoked
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
		};
	} else {
		resShim = {
			headers: new Map<string, string>(),
			setHeader(k: string, v: string) {
				this.headers.set(k, v);
			},
			send(body: string, status?: number) {
				// Prefer global Response when available
				// Prefer global Response when available
				const G = globalThis as unknown as Record<string, unknown>;
				if (typeof G.Response === "function") {
					return new G.Response(body, {
						headers: Object.fromEntries(this.headers),
						status,
					});
				}
				return { body, headers: Object.fromEntries(this.headers), status };
			},
		};
	}

	// Ensure SVG content-type and nosniff for embeds
	resShim.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
	resShim.setHeader("X-Content-Type-Options", "nosniff");
	resShim.setHeader("Vary", "Accept-Encoding");

	if (!id) {
		const body = renderError({
			message: 'Missing params "id" make sure you pass the parameters in URL',
			secondaryMessage: "/api/gist?id=GIST_ID",
		});
		// If caller provided an Express-like `res`, set status on it then send
		if (externalRes && typeof externalRes.status === "function") {
			externalRes.status(400);
			return externalRes.send(body);
		}
		// otherwise use the shim's Response-like return value
		return resShim.send(body, 400);
	}

	const access = guardAccess({
		res: resShim,
		id,
		type: "gist",
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
		const gistData = await fetchGist(String(id));
		const requestedValue =
			"cache_seconds" in q &&
			(q as Record<string, unknown>).cache_seconds !== undefined
				? parseInt(String(cache_seconds), 10)
				: NaN;
		const cacheSeconds = resolveCacheSeconds({
			requested: requestedValue,
			def: CACHE_TTL.GIST_CARD.DEFAULT,
			min: CACHE_TTL.GIST_CARD.MIN,
			max: CACHE_TTL.GIST_CARD.MAX,
		});

		setCacheHeaders(resShim, cacheSeconds);

		return resShim.send(
			renderGistCard(gistData, {
				title_color,
				icon_color,
				text_color,
				bg_color,
				theme: theme as unknown as string,
				border_radius: border_radius ? Number(border_radius) : undefined,
				border_color,
				locale: locale ? locale.toLowerCase() : undefined,
				show_owner: parseBoolean(show_owner),
				hide_border: parseBoolean(hide_border),
			} as unknown as Record<string, unknown>),
		);
	} catch (err: unknown) {
		setErrorCacheHeaders(resShim);
		const e = err as { message?: string; secondaryMessage?: string };
		resShim.setHeader("Content-Type", "image/svg+xml");
		return resShim.send(
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
		);
	}
}
