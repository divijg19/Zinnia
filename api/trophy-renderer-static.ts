// Prefer `src` during development/tests and `dist` in production.
let cached: ((opts: any) => string) | null = null;
let injected: ((opts: any) => string) | null = null;

export function __testSetRenderer(fn: (opts: any) => string) {
	injected = fn;
}

export function __testResetRenderer() {
	injected = null;
	cached = null;
}

async function loadRenderer(): Promise<(opts: any) => string> {
	if (injected) return injected;
	if (cached) return cached;
	// Prefer src paths first so tests and source deployments resolve consistently.
	const specCandidates = [
		"../trophy/src/renderer",
		"../trophy/src/index",
		"../trophy/src/renderer.js",
		"../trophy/src/index.js",
		"../trophy/dist/index.js",
		"../trophy/dist/renderer.js",
	];

	const failures: Array<{ spec: string; err: string }> = [];
	for (const spec of specCandidates) {
		try {
			const mod = await import(spec);
			const fn = mod.renderTrophySVG ?? mod.default?.renderTrophySVG ?? mod.default;
			if (typeof fn === "function") {
				cached = fn;
				return fn;
			} else {
				failures.push({ spec, err: "no renderer export found" });
			}
		} catch (e) {
			try {
				const em = e?.toString?.() ?? String(e);
				failures.push({ spec, err: em });
			} catch {
				failures.push({ spec, err: "unknown import error" });
			}
		}
	}

	// Attempt absolute file URLs as last resort
	const hrefCandidates = [
		new URL("../trophy/src/renderer.js", import.meta.url).href,
		new URL("../trophy/src/index.js", import.meta.url).href,
		new URL("../trophy/dist/index.js", import.meta.url).href,
	];
	for (const h of hrefCandidates) {
		try {
			const mod = await import(h);
			const fn = mod.renderTrophySVG ?? mod.default?.renderTrophySVG ?? mod.default;
			if (typeof fn === "function") {
				cached = fn;
				return fn;
			} else {
				failures.push({ spec: h, err: "no renderer export found" });
			}
		} catch (e) {
			try {
				const em = e?.toString?.() ?? String(e);
				failures.push({ spec: h, err: em });
			} catch {
				failures.push({ spec: h, err: "unknown import error" });
			}
		}
	}

	try {
		console.warn("trophy: renderer not found; attempted candidates:", failures.map((f) => `${f.spec}: ${f.err}`));
	} catch { }
	throw new Error("trophy renderer not found (tried src and dist paths)");
}

export default async function renderWrapper(opts: any): Promise<string> {
	const fn = await loadRenderer();
	return fn(opts);
}
