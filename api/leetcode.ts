import type { VercelRequest, VercelResponse } from "@vercel/node";

function svg(body: string) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="${body}"><title>${body}</title><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f9fafb" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">${body}</text></svg>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const proto = (req.headers["x-forwarded-proto"] || "https").toString();
        const host = (req.headers.host || "localhost").toString();
        const url = new URL((req.url as string) || "/api/leetcode", `${proto}://${host}`);
        // path param support: /api/leetcode/<username>
        const path = url.pathname.replace(/^\//, "").split("/");
        if (path[0] === "api" && path[1] === "leetcode" && path[2]) {
            url.searchParams.set("username", path[2]);
        }
        const username = url.searchParams.get("username");
        if (!username) {
            res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
            res.status(200);
            return res.send(svg("Missing ?username=..."));
        }

        const config = Object.fromEntries(url.searchParams.entries()) as Record<
            string,
            string
        >;
        let sanitized: any;
        try {
            // Lazy import to avoid cold-start or bundling failures from crashing the function
            const { sanitize } = (await import(
                "../leetcode/packages/cloudflare-worker/src/sanitize.ts"
            )) as { sanitize: (cfg: Record<string, string>) => unknown };
            sanitized = sanitize(config);
        } catch (_e) {
            res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
            res.status(200);
            return res.send(svg("Invalid parameters"));
        }

        const envDefault =
            parseInt(
                process.env.LEETCODE_CACHE_SECONDS ||
                process.env.CACHE_SECONDS ||
                "300",
                10,
            ) || 300;
        const cacheSeconds = config.cache
            ? parseInt(config.cache, 10) || envDefault
            : envDefault;

        let generator: any;
        try {
            const { Generator } = (await import(
                "../leetcode/packages/core/src/card.ts"
            )) as { Generator: new (...args: any[]) => any };
            generator = new Generator(null as unknown as Cache, {});
        } catch (_e) {
            res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
            res.status(200);
            return res.send(svg("leetcode: internal error"));
        }
        generator.verbose = false;
        try {
            const svgOut = await generator.generate(sanitized);
            res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
            res.setHeader(
                "Cache-Control",
                `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
            );
            return res.send(svgOut);
        } catch (_e) {
            res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
            res.status(200);
            return res.send(svg("LeetCode generation failed"));
        }
    } catch (_err) {
        res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
        res.status(200);
        return res.send(svg("leetcode: internal error"));
    }
}
