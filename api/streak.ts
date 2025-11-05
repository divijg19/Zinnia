function svg(body: string) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="${body}"><title>${body}</title><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f9fafb" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">${body}</text></svg>`;
}

import type { VercelRequest, VercelResponse } from "@vercel/node";

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
        const token = process.env.TOKEN;
        if (token && !upstream.searchParams.has("token"))
            upstream.searchParams.set("token", token);
        const cacheSeconds =
            parseInt(
                process.env.STREAK_CACHE_SECONDS || process.env.CACHE_SECONDS || "300",
                10,
            ) || 300;
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
        res.setHeader(
            "Cache-Control",
            `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
        );
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
