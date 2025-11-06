function svg(body: string) {
	return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="${body}"><title>${body}</title><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f9fafb" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">${body}</text></svg>`;
}

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { resolveCacheSeconds, setCacheHeaders } from "./_utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		const proto = (req.headers["x-forwarded-proto"] || "https").toString();
		const host = (req.headers.host || "localhost").toString();
		const url = new URL(req.url as string, `${proto}://${host}`);
		const user =
			url.searchParams.get("user") ?? url.searchParams.get("username");
		if (!user) {
			res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
			res.status(200);
			return res.send(svg("Missing ?user= or ?username=..."));
		}
		const upstream = new URL("https://streak-stats.demolab.com/");
		for (const [k, v] of url.searchParams) upstream.searchParams.set(k, v);
		upstream.searchParams.set("user", user);
		// Map theme=watchdog to explicit color params supported by upstream
		const theme = (url.searchParams.get("theme") || "").toLowerCase();
		if (theme === "watchdog") {
			// Remove theme to avoid overriding our colors upstream
			upstream.searchParams.delete("theme");
			const wd: Record<string, string> = {
				background: "45,520806,021D4A",
				border: "#E4E2E2",
				stroke: "#E4E2E2",
				ring: "#FE428E",
				fire: "#EB8C30",
				currStreakNum: "#F8D847",
				sideNums: "#FE428E",
				currStreakLabel: "#F8D847",
				sideLabels: "#FE428E",
				dates: "#A9FEF7",
				excludeDaysLabel: "#A9FEF7",
			};
			for (const [k, v] of Object.entries(wd)) {
				if (!upstream.searchParams.has(k)) upstream.searchParams.set(k, v);
			}
		}
		const token = process.env.TOKEN;
		if (token && !upstream.searchParams.has("token"))
			upstream.searchParams.set("token", token);
		const cacheSeconds = resolveCacheSeconds(url, [
			"STREAK_CACHE_SECONDS",
			"CACHE_SECONDS",
		], 86400);
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
			res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
			res.status(200);
			return res.send(svg("Upstream streak fetch failed"));
		} finally {
			clearTimeout(timeout);
		}
		const ct = resp.headers.get("content-type") || "";
		const body = await resp.text();
		res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
		setCacheHeaders(res, cacheSeconds);
		if (ct.includes("image/svg")) {
			return res.send(body);
		}
		return res.send(svg(`Upstream streak returned ${resp.status}`));
	} catch (_err) {
		res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
		res.status(200);
		return res.send(svg("streak: internal error"));
	}
}
