function svg(body: string) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="${body}"><title>${body}</title><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f9fafb" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">${body}</text></svg>`;
}

export default async function handler(req: any, res: any) {
    try {
        const proto = (req.headers["x-forwarded-proto"] || "https").toString();
        const host = (req.headers.host || "localhost").toString();
        const url = new URL(req.url, `${proto}://${host}`);
        const username = url.searchParams.get("username");
        if (!username) {
            // defer to underlying module for demo HTML if available
            try {
                const mod = await import(new URL("../leetcode/api/index.ts", import.meta.url).href);
                const h = (mod.default || mod) as any;
                return h(req, res);
            } catch {
                res.setHeader("Content-Type", "text/html; charset=utf-8");
                res.status(200);
                return res.send("<h1>LeetCode Service</h1><p>Add ?username=...</p>");
            }
        }
        // Try to call the existing generator; if it fails, return a fallback SVG
        try {
            const mod = await import(new URL("../leetcode/api/index.ts", import.meta.url).href);
            const h = (mod.default || mod) as any;
            return h(req, res);
        } catch (_err) {
            res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
            res.status(200);
            return res.send(svg("LeetCode temporarily unavailable"));
        }
    } catch (_err) {
        res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
        res.status(200);
        return res.send(svg("leetcode: internal error"));
    }
}
