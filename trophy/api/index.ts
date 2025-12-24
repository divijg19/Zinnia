import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
	setShortCacheHeaders,
	setSvgHeaders,
} from "../../lib/canonical/http_cache";
import { loadTrophyModule } from "../../lib/canonical/trophy_loader";
import { getGithubPATWithKeyForServiceAsync } from "../../lib/tokens";

// Default cache: 48 hours (in seconds) unless overridden via env
const DEFAULT_TROPHY_CACHE =
	parseInt(
		process.env.TROPHY_CACHE_SECONDS || process.env.CACHE_SECONDS || "172800",
		10,
	) || 172800;
// Retry/timeouts removed — upstream proxying was consolidated out.

function svgError(message: string, cacheSeconds = DEFAULT_TROPHY_CACHE) {
	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="${message}"><title>${message}</title><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f9fafb" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">${message}</text></svg>`;
	return new Response(body, {
		status: 200,
		headers: new Headers({
			"Content-Type": "image/svg+xml; charset=utf-8",
			"Cache-Control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=300`,
		}),
	});
}

async function renderLocalTrophy(
	username: string,
	token: string,
	params: URLSearchParams,
): Promise<string> {
	const mod = await loadTrophyModule();
	// If the compiled trophy API bundle exposes a convenience `renderLocalTrophy`, prefer it.
	const direct = mod.renderLocalTrophy ?? mod.default?.renderLocalTrophy;
	if (direct) return await direct(username, token, params);
	const GithubApiService =
		mod.GithubApiService ??
		mod.default?.GithubApiService ??
		mod.Services?.GithubApiService;
	const Card = mod.Card ?? mod.default?.Card;
	const COLORS = mod.COLORS ?? mod.default?.COLORS;

	if (!GithubApiService || !Card || !COLORS)
		throw new Error("trophy runtime API incomplete");

	const service = new GithubApiService(token);
	const userInfoOrError = await service.requestUserInfo(username);
	if (userInfoOrError instanceof Error) {
		throw userInfoOrError;
	}

	const themeName = params.get("theme") || "flat";
	const theme = COLORS[themeName] || COLORS.flat;

	const titles = (params.get("title") || "").split(",").filter(Boolean);
	const ranks = (params.get("rank") || "").split(",").filter(Boolean);
	const column = Number(params.get("column") || "-1");
	const row = Number(params.get("row") || "3");
	const marginW = Number(params.get("margin-w") || "0");
	const marginH = Number(params.get("margin-h") || "0");
	const noBg = params.get("no-bg") === "true";
	const noFrame = params.get("no-frame") === "true";

	const card = new Card(
		titles,
		ranks,
		column,
		row,
		110,
		marginW,
		marginH,
		noBg,
		noFrame,
	);

	return card.render(userInfoOrError, theme);
}

// Trophy handler supports two modes:
// - Local (Node/TS SVG renderer): ?mode=local (default)
// - Proxy: fetches upstream SVG when explicitly enabled via env or ?mode=proxy
export async function handleWeb(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const username = url.searchParams.get("username");
	if (!username) return svgError("Missing ?username=...");

	const cacheSeconds =
		parseInt(
			process.env.TROPHY_CACHE_SECONDS || process.env.CACHE_SECONDS || "300",
			10,
		) || 300;

	// Acquire a PAT if available; prefer explicit ?token= query when provided
	let patInfo: { key: string; token: string } | undefined;
	if (!url.searchParams.has("token")) {
		patInfo = await getGithubPATWithKeyForServiceAsync("trophy");
	} else {
		patInfo = { key: "custom", token: url.searchParams.get("token") || "" };
	}

	try {
		// If we have a usable PAT, produce a full local rendering using the live API
		if (patInfo?.token) {
			const svg = await renderLocalTrophy(
				username,
				patInfo.token,
				url.searchParams,
			);
			const headers = new Headers();
			setSvgHeaders({
				setHeader: (k: string, v: string) => headers.set(k, v),
			} as any);
			setShortCacheHeaders(
				{ setHeader: (k: string, v: string) => headers.set(k, v) } as any,
				cacheSeconds,
			);
			return new Response(svg, { headers });
		}

		// No token available — fall back to the lightweight stub renderer (no network)
		try {
			const mod = await loadTrophyModule();
			const renderTrophySVG =
				mod.renderTrophySVG ?? mod.default?.renderTrophySVG;
			const theme = url.searchParams.get("theme") || undefined;
			const title = url.searchParams.get("title") || undefined;
			const columns = Number(url.searchParams.get("columns") || "4") || 4;
			if (renderTrophySVG) {
				const svg = renderTrophySVG({ username, theme, title, columns });
				const headers = new Headers();
				setSvgHeaders({
					setHeader: (k: string, v: string) => headers.set(k, v),
				} as any);
				setShortCacheHeaders(
					{ setHeader: (k: string, v: string) => headers.set(k, v) } as any,
					cacheSeconds,
				);
				return new Response(svg, { headers });
			}
		} catch {
			// ignore and fall through to simple fallback
		}

		// Final fallback simple stub
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60"><rect width="100%" height="100%" fill="#111827"/></svg>`;
		return new Response(svg, {
			headers: new Headers({
				"Content-Type": "image/svg+xml; charset=utf-8",
			}),
		});
	} catch {
		return svgError("trophy: internal error");
	}
}

// Bridge for @vercel/node (Node.js Serverless) -> Web Response
export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		const proto = (req.headers["x-forwarded-proto"] || "https").toString();
		const host = (req.headers.host || "localhost").toString();
		const fullUrl = req.url || "/";
		const url = new URL(fullUrl, `${proto}://${host}`);
		const nodeHeaders = new Headers();
		for (const [k, v] of Object.entries(req.headers || {})) {
			if (Array.isArray(v)) nodeHeaders.set(k, v.join(", "));
			else if (typeof v === "string") nodeHeaders.set(k, v);
		}
		const webReq = new Request(url.toString(), {
			method: req.method,
			headers: nodeHeaders,
		});
		const webResp = await handleWeb(webReq);
		res.status(webResp.status);
		webResp.headers.forEach((value, key) => {
			res.setHeader(key, value);
		});
		const text = await webResp.text();
		return res.send(text);
	} catch (_err) {
		setSvgHeaders(res);
		setShortCacheHeaders(res, 60);
		res.status(200);
		return res.send(
			`<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="trophy: internal error"><title>trophy: internal error</title><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f9fafb" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">trophy: internal error</text></svg>`,
		);
	}
}
