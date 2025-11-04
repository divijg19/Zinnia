import { renderTrophySVG } from "../src/renderer";

// Trophy handler supports two modes:
// - Local (Node/TS SVG renderer): TROPHY_MODE=local or ?mode=local
// - Proxy (default): fetches upstream SVG and returns it for full feature coverage
export default async function handler(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const username = url.searchParams.get("username");
	if (!username) {
		return new Response("Missing ?username=...", {
			status: 400,
			headers: new Headers({ "Content-Type": "text/plain; charset=utf-8" }),
		});
	}

	const mode = (
		url.searchParams.get("mode") ||
		process.env.TROPHY_MODE ||
		"proxy"
	).toLowerCase();
	if (mode === "local") {
		const theme = url.searchParams.get("theme") || undefined;
		const title = url.searchParams.get("title") || undefined;
		const columns = Number(url.searchParams.get("columns") || "4") || 4;
		const svg = renderTrophySVG({ username, theme, title, columns });
		return new Response(svg, {
			headers: new Headers({
				"Content-Type": "image/svg+xml; charset=utf-8",
				"Cache-Control":
					"public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
			}),
		});
	}

	// Default: Proxy to upstream for rich/complete rendering
	const upstream = new URL("https://github-profile-trophy.vercel.app/");
	for (const [k, v] of url.searchParams) upstream.searchParams.set(k, v);
	const token = process.env.TROPHY_TOKEN;
	if (token && !upstream.searchParams.has("token"))
		upstream.searchParams.set("token", token);

	const resp = await fetch(upstream.toString(), {
		headers: { "User-Agent": "zinnia/1.0 (+trophy)" },
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
