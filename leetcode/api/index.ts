import Header from "../packages/cloudflare-worker/src/headers";
import { sanitize } from "../packages/cloudflare-worker/src/sanitize";
import { Generator } from "../packages/core/src/card";
import type { Config } from "../packages/core/src/types";

async function generate(
	config: Record<string, string>,
	header: Record<string, string>,
) {
	let sanitized: Config;
	try {
		// reuse sanitize from cloudflare worker
		sanitized = sanitize(config) as unknown as Config;
	} catch (err) {
		return new Response((err as Error).message, { status: 400 });
	}

	const envDefault =
		parseInt(
			process.env.LEETCODE_CACHE_SECONDS || process.env.CACHE_SECONDS || "300",
			10,
		) || 300;
	const cache_time = config.cache
		? parseInt(config.cache, 10) || envDefault
		: envDefault;
	// the core Generator in this monorepo expects a cache; in Vercel Node we'll pass null
	const generator = new Generator(
		null as unknown as Cache,
		header as Record<string, string>,
	);
	generator.verbose = false;

	const headers = new Header().add("cors", "svg");
	headers.set(
		"cache-control",
		`public, max-age=${cache_time}, s-maxage=${cache_time}, stale-while-revalidate=86400`,
	);

	return new Response(await generator.generate(sanitized), { headers });
}

export default async function handler(req: Request): Promise<Response> {
	const url = new URL(req.url);

	// path param support: /leetcode/username -> username as first segment
	const path = url.pathname.replace(/^\//, "").split("/");
	if (path[0] === "leetcode" && path[1]) {
		url.searchParams.set("username", path[1]);
	}

	const query = Object.fromEntries(url.searchParams.entries()) as Record<
		string,
		string
	>;
	if (!query.username) {
		// return simple HTML demo
		const demo = (await import("../packages/cloudflare-worker/src/demo"))
			.default;
		return new Response(demo, {
			headers: new Headers({ "Content-Type": "text/html" }),
		});
	}

	return await generate(query, {
		"user-agent": req.headers.get("user-agent") || "Unknown",
	});
}
