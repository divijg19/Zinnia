// Prefer runtime-built `dist` renderer in production; fall back to `src` for dev/tests.
let cached: ((opts: any) => string) | null = null;

async function loadRenderer(): Promise<(opts: any) => string> {
	if (cached) return cached;
	// Try plain module specifiers first (Vitest mocks/doMock intercept these),
	// then fall back to URL.href imports which are necessary in some runtimes.
	const specCandidates = [
		"../trophy/dist/index.js",
		"../trophy/dist/renderer.js",
		"../trophy/src/renderer",
		"../trophy/src/renderer.js",
		"../trophy/src/renderer.ts",
		"../trophy/src/index.js",
		"../trophy/src/index.ts",
	];
	for (const spec of specCandidates) {
		try {
			const mod = await import(spec);
			const fn =
				mod.renderTrophySVG ?? mod.default?.renderTrophySVG ?? mod.default;
			if (typeof fn === "function") {
				cached = fn;
				return fn;
			}
		} catch {
			// try next
		}
	}
	// Fallback: attempt imports using absolute file URLs (some deploy runtimes require this)
	const hrefCandidates = [
		new URL("../trophy/dist/index.js", import.meta.url).href,
		new URL("../trophy/dist/renderer.js", import.meta.url).href,
		new URL("../trophy/src/renderer.js", import.meta.url).href,
		new URL("../trophy/src/renderer.ts", import.meta.url).href,
		new URL("../trophy/src/index.js", import.meta.url).href,
		new URL("../trophy/src/index.ts", import.meta.url).href,
	];
	for (const h of hrefCandidates) {
		try {
			const mod = await import(h);
			const fn =
				mod.renderTrophySVG ?? mod.default?.renderTrophySVG ?? mod.default;
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
