// Streak proxy: fetch SVG from upstream service so we stay Node-only in this monorepo
// and keep embeds compatible. Supports both ?user= and ?username=.
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

export default async function handler(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const user = url.searchParams.get("user") ?? url.searchParams.get("username");
	if (!user) return svgError("Missing ?user= or ?username=...");

	const upstream = new URL("https://streak-stats.demolab.com/");
	for (const [k, v] of url.searchParams) upstream.searchParams.set(k, v);
	// Normalize parameter name expected by upstream
	upstream.searchParams.set("user", user);

	const token = process.env.TOKEN;
	if (token && !upstream.searchParams.has("token")) {
		upstream.searchParams.set("token", token);
	}

	const cacheSeconds =
		parseInt(
			process.env.STREAK_CACHE_SECONDS || process.env.CACHE_SECONDS || "300",
			10,
		) || 300;

	// Upstream fetch with timeout protection
	const ctrl = new AbortController();
	const timeout = setTimeout(() => ctrl.abort("timeout"), 10_000);
	let resp: Response;
	try {
		resp = await fetch(upstream.toString(), {
			headers: { "User-Agent": "zinnia/1.0 (+streak)" },
			signal: ctrl.signal,
		});
	} catch (_e) {
		clearTimeout(timeout);
		return svgError("Upstream streak fetch failed");
	} finally {
		clearTimeout(timeout);
	}
	const body = await resp.text();

	return new Response(body, {
		status: resp.status,
		headers: new Headers({
			"Content-Type": "image/svg+xml; charset=utf-8",
			"Cache-Control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
		}),
	});
}
