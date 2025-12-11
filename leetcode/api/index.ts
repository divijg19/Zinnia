import { setShortCacheHeaders, setSvgHeaders } from "../../api/_utils.js";
import { createHeaders } from "../packages/cloudflare-worker/src/headers.js";
import { sanitize } from "../packages/cloudflare-worker/src/sanitize.js";
import { Generator } from "../packages/core/src/card.js";
import type { Config } from "../packages/core/src/types.js";

async function generate(
	config: Record<string, string>,
	header: Record<string, string>,
) {
	let sanitized: Config;
	try {
		// reuse sanitize from cloudflare worker
		sanitized = sanitize(config) as unknown as Config;
	} catch (err) {
		const msg = (err as Error).message || "Invalid parameters";
		const body = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="${msg}"><title>${msg}</title><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f9fafb" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">${msg}</text></svg>`;
		return new Response(body, {
			headers: new Headers({
				"Content-Type": "image/svg+xml; charset=utf-8",
				"Cache-Control": `public, max-age=60, s-maxage=60, stale-while-revalidate=300`,
			}),
		});
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

	const headers = createHeaders().add("cors", "svg");
	headers.set(
		"cache-control",
		`public, max-age=${cache_time}, s-maxage=${cache_time}, stale-while-revalidate=86400`,
	);

	try {
		const svg = await generator.generate(sanitized);
		return new Response(svg, { headers: headers.toObject() });
	} catch (err) {
		const msg = (err as Error).message || "LeetCode generation failed";
		const body = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="${msg}"><title>${msg}</title><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f9fafb" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">${msg}</text></svg>`;
		return new Response(body, {
			headers: new Headers({
				"Content-Type": "image/svg+xml; charset=utf-8",
				"Cache-Control": `public, max-age=60, s-maxage=60, stale-while-revalidate=300`,
			}),
		});
	}
}

async function handleWeb(req: Request): Promise<Response> {
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
		// The demo module lives in a package folder; suppress TS resolution here.
		const demo =
			// @ts-expect-error: dynamic import resolves at runtime
			(await import("../packages/cloudflare-worker/src/demo/index.js")).default;
		return new Response(demo, {
			headers: new Headers({ "Content-Type": "text/html" }),
		});
	}

	return await generate(query, {
		"user-agent": req.headers.get("user-agent") || "Unknown",
	});
}

// Bridge for @vercel/node (Node.js Serverless) -> Web Response
export default async function handler(req: any, res: any) {
	try {
		const proto = (req.headers["x-forwarded-proto"] || "https").toString();
		const host = (req.headers.host || "localhost").toString();
		const url = new URL(req.url, `${proto}://${host}`);
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
			`<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="leetcode: internal error"><title>leetcode: internal error</title><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f9fafb" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">leetcode: internal error</text></svg>`,
		);
	}
}
