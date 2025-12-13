// Prefer runtime-built `dist` renderer in production; fall back to `src` for dev/tests.
let cached: ((opts: any) => string) | null = null;

async function loadRenderer(): Promise<(opts: any) => string> {
    if (cached) return cached;
    const candidates = [
        new URL("../trophy/dist/index.js", import.meta.url).href,
        new URL("../trophy/dist/renderer.js", import.meta.url).href,
        new URL("../trophy/src/renderer.js", import.meta.url).href,
        new URL("../trophy/src/renderer.ts", import.meta.url).href,
    ];
    for (const p of candidates) {
        try {
            // dynamic import works in ESM and on Vercel runtimes
            const mod = await import(p);
            const fn = mod.renderTrophySVG ?? mod.default?.renderTrophySVG ?? mod.default;
            if (typeof fn === "function") {
                cached = fn;
                return fn;
            }
        } catch {
            // try next
        }
    }
    throw new Error("trophy renderer not found (tried dist and src paths)");
}

export default async function renderWrapper(opts: any): Promise<string> {
    const fn = await loadRenderer();
    return fn(opts);
}
