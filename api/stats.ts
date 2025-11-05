function svg(body: string) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="${body}"><title>${body}</title><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f9fafb" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">${body}</text></svg>`;
}

export default async function handler(req: any, res: any) {
    try {
        if (!process.env.PAT_1 && !process.env.PAT_2 && !process.env.PAT_3) {
            res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
            res.status(200);
            return res.send(svg("Set PAT_1 in Vercel for stats"));
        }
        const mod = await import(new URL("../stats/api/index.js", import.meta.url).href);
        const h = (mod.default || mod) as any;
        return h(req, res);
    } catch (_err) {
        res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
        res.status(200);
        return res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="stats: internal error"><title>stats: internal error</title><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f9fafb" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">stats: internal error</text></svg>`);
    }
}
