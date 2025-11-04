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

	const resp = await fetch(upstream.toString(), {
		headers: { "User-Agent": "zinnia/1.0 (+streak)" },
	});
	const body = await resp.text();

	return new Response(body, {
		status: resp.status,
		headers: new Headers({
			"Content-Type": "image/svg+xml; charset=utf-8",
			"Cache-Control":
				"public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
		}),
	});
}
