import type { VercelRequest, VercelResponse } from "@vercel/node";
import { renderTrophySVG } from "../src/renderer";

function svgError(message: string, cacheSeconds = 60) {
	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="${message}"><title>${message}</title><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f9fafb" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">${message}</text></svg>`;
	return new Response(body, {
		status: 200,
		headers: new Headers({
			"Content-Type": "image/svg+xml; charset=utf-8",
			"Cache-Control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=300`,
		}),
	});
}

// Trophy handler supports two modes:
// - Local (Node/TS SVG renderer): TROPHY_MODE=local or ?mode=local
// - Proxy (default): fetches upstream SVG and returns it for full feature coverage
export async function handleWeb(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const username = url.searchParams.get("username");
	if (!username) {
		return svgError("Missing ?username=...");
	}

	const mode = (
		url.searchParams.get("mode") ||
		process.env.TROPHY_MODE ||
		"proxy"
	).toLowerCase();
	const cacheSeconds =
		parseInt(
			process.env.TROPHY_CACHE_SECONDS || process.env.CACHE_SECONDS || "300",
			10,
		) || 300;

	if (mode === "local") {
		const theme = url.searchParams.get("theme") || undefined;
		const title = url.searchParams.get("title") || undefined;
		const columns = Number(url.searchParams.get("columns") || "4") || 4;
		const svg = renderTrophySVG({ username, theme, title, columns });
		return new Response(svg, {
			headers: new Headers({
				"Content-Type": "image/svg+xml; charset=utf-8",
				"Cache-Control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
			}),
		});
	}

	// Default: Proxy to upstream for rich/complete rendering
	const upstream = new URL("https://github-profile-trophy.vercel.app/");
	for (const [k, v] of url.searchParams) upstream.searchParams.set(k, v);
	const token = process.env.TROPHY_TOKEN;
	if (token && !upstream.searchParams.has("token"))
		upstream.searchParams.set("token", token);

	// Upstream fetch with timeout protection
	const ctrl = new AbortController();
	const timeout = setTimeout(() => ctrl.abort("timeout"), 10_000);
	let resp: Response;
	try {
		resp = await fetch(upstream.toString(), {
			headers: { "User-Agent": "zinnia/1.0 (+trophy)" },
			signal: ctrl.signal,
		});
	} catch (_e) {
		clearTimeout(timeout);
		return svgError("Upstream trophy fetch failed");
	} finally {
		clearTimeout(timeout);
	}
	if (!resp.ok) {
		return svgError(`Upstream trophy returned ${resp.status}`);
	}
	const body = await resp.text();
	return new Response(body, {
		headers: new Headers({
			"Content-Type": "image/svg+xml; charset=utf-8",
			"Cache-Control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
		}),
	});
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
		res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
		res.status(200);
		return res.send(
			`<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="trophy: internal error"><title>trophy: internal error</title><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f9fafb" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">trophy: internal error</text></svg>`,
		);
	}
}
