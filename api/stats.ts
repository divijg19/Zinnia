import type { VercelRequest, VercelResponse } from "@vercel/node";

function svg(body: string) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="${body}"><title>${body}</title><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f9fafb" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">${body}</text></svg>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (!process.env.PAT_1 && !process.env.PAT_2 && !process.env.PAT_3) {
            res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
            res.status(200);
            return res.send(svg("Set PAT_1 in Vercel for stats"));
        }
        // Use the Request-based TS handler to avoid Express coupling and bundling surprises.
        const { default: statsRequestHandler } = (await import(
            "../stats/api/index.ts"
        )) as { default: (req: Request) => Promise<Response> };
        const proto = (req.headers["x-forwarded-proto"] || "https").toString();
        const host = (req.headers.host || "localhost").toString();
        const fullUrl = new URL((req.url as string) || "/api/stats", `${proto}://${host}`).toString();
        const headers = new Headers();
        for (const [k, v] of Object.entries(
            req.headers as Record<string, string>,
        )) {
            if (typeof v === "string") headers.set(k, v);
        }
        const webReq = new Request(fullUrl, { method: req.method, headers });
        const webRes = await statsRequestHandler(webReq as unknown as Request);
        const body = await webRes.text();
        res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
        const cacheSeconds =
            parseInt(process.env.STATS_CACHE_SECONDS || process.env.CACHE_SECONDS || "300", 10) || 300;
        const cacheHeader = webRes.headers.get("cache-control");
        res.setHeader(
            "Cache-Control",
            cacheHeader || `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
        );
        res.status(200);
        return res.send(body);
    } catch (_err) {
        res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
        res.status(200);
        return res.send(
            `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="stats: internal error"><title>stats: internal error</title><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f9fafb" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">stats: internal error</text></svg>`,
        );
    }
}
