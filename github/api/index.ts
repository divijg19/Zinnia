// Minimal GitHub adapter that can be extended to call into other modules.
export default async function handler(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const q = Object.fromEntries(url.searchParams.entries()) as Record<
		string,
		string
	>;

	if (!q.username) {
		return new Response("<h1>GitHub Service</h1>", {
			headers: new Headers({ "Content-Type": "text/html" }),
		});
	}

	// Placeholder SVG response — replace with actual implementation if needed
	const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='80'><rect width='100%' height='100%' fill='#111'/><text x='20' y='45' fill='#fff'>GitHub for ${q.username}</text></svg>`;
	return new Response(svg, {
		headers: new Headers({
			"Content-Type": "image/svg+xml",
			"Cache-Control":
				"public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
		}),
	});
}
