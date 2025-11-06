//

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendErrorSvg } from "../lib/errors.ts";
import { filterThemeParam, getUsername } from "../lib/params.ts";
import { WATCHDOG } from "../lib/themes.ts";
import {
	resolveCacheSeconds,
	setCacheHeaders,
	setEtagAndMaybeSend304,
	setSvgHeaders,
} from "./_utils.ts";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		const proto = (req.headers["x-forwarded-proto"] || "https").toString();
		const host = (req.headers.host || "localhost").toString();
		const url = new URL(req.url as string, `${proto}://${host}`);
		const user = getUsername(url, ["user", "username"]);
		if (!user) {
			return sendErrorSvg(
				req,
				res,
				"Missing or invalid ?user= or ?username=...",
				"UNKNOWN",
			);
		}
		const upstream = new URL("https://streak-stats.demolab.com/");
		for (const [k, v] of url.searchParams) upstream.searchParams.set(k, v);
		upstream.searchParams.set("user", user);
		// Map theme=watchdog to explicit color params supported by upstream
		filterThemeParam(url);
		const theme = (url.searchParams.get("theme") || "").toLowerCase();
		if (theme === "watchdog") {
			// Remove theme to avoid overriding our colors upstream
			upstream.searchParams.delete("theme");
			const wd = WATCHDOG as Record<string, string>;
			for (const [k, v] of Object.entries({
				background: wd.background,
				border: wd.border,
				stroke: wd.stroke,
				ring: wd.ring,
				fire: wd.fire,
				currStreakNum: wd.currStreakNum,
				sideNums: wd.sideNums,
				currStreakLabel: wd.currStreakLabel,
				sideLabels: wd.sideLabels,
				dates: wd.dates,
				excludeDaysLabel: wd.excludeDaysLabel,
			})) {
				if (!upstream.searchParams.has(k)) upstream.searchParams.set(k, v);
			}
		}
		const token = process.env.TOKEN;
		if (token && !upstream.searchParams.has("token"))
			upstream.searchParams.set("token", token);
		const cacheSeconds = resolveCacheSeconds(
			url,
			["STREAK_CACHE_SECONDS", "CACHE_SECONDS"],
			86400,
		);
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
			return sendErrorSvg(
				req,
				res,
				"Upstream streak fetch failed",
				"STREAK_UPSTREAM_FETCH",
			);
		} finally {
			clearTimeout(timeout);
		}
		const ct = resp.headers.get("content-type") || "";
		const body = await resp.text();
		setSvgHeaders(res);
		setCacheHeaders(res, cacheSeconds);
		if (ct.includes("image/svg")) {
			if (setEtagAndMaybeSend304(req.headers as any, res, body))
				return res.send("");
			return res.send(body);
		}
		return sendErrorSvg(
			req,
			res,
			`Upstream streak returned ${resp.status}`,
			"STREAK_UPSTREAM_STATUS",
		);
	} catch (_err) {
		return sendErrorSvg(req, res, "streak: internal error", "STREAK_INTERNAL");
	}
}
