// Streak proxy: fetch SVG from upstream service so we stay Node-only in this monorepo
// and keep embeds compatible. Supports both ?user= and ?username=.
export default async function handler(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const user = url.searchParams.get("user") ?? url.searchParams.get("username");
	if (!user) {
		return new Response("Missing ?user= or ?username=...", {
			status: 400,
			headers: new Headers({ "Content-Type": "text/plain; charset=utf-8" }),
		});
	}

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
		return new Response("Upstream streak fetch failed", {
			status: 502,
			headers: new Headers({
				"Content-Type": "text/plain; charset=utf-8",
				"Cache-Control": `public, max-age=60, s-maxage=60, stale-while-revalidate=300`,
			}),
		});
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
