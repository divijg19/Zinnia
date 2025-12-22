// Prefer `src` during development/tests and `dist` in production.
type TrophyRenderer = (opts: any) => string;
let cached: TrophyRenderer | undefined;
let injected: TrophyRenderer | undefined;

export function __testSetRenderer(fn: TrophyRenderer) {
	injected = fn;
}

export function __testResetRenderer() {
	injected = undefined;
	cached = undefined;
}

async function loadRenderer(): Promise<TrophyRenderer> {
	if (injected) return injected;
	if (cached) return cached;
	// Prefer build outputs placed into the API bundle (api/_build) so serverless
	// functions can import them at runtime. When running tests prefer the
	// package `src` so Vitest module mocks are respected.
	const isTest =
		process.env.NODE_ENV === "test" || Boolean((globalThis as any).__vitest);
	const specCandidates = isTest
		? [
				"../trophy/src/renderer",
				"../trophy/src/index",
				"../trophy/src/renderer.js",
				"../trophy/src/index.js",
				"./_build/trophy/renderer",
				"./_build/trophy/index",
				"./_build/trophy/renderer.js",
				"./_build/trophy/index.js",
				"../trophy/dist/index.js",
				"../trophy/dist/renderer.js",
			]
		: [
				"./_build/trophy/renderer",
				"./_build/trophy/index",
				"./_build/trophy/renderer.js",
				"./_build/trophy/index.js",
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
			const fn =
				mod.renderTrophySVG ?? mod.default?.renderTrophySVG ?? mod.default;
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

	// Attempt absolute file URLs as last resort (include api/_build paths)
	const hrefCandidates = [
		new URL("./_build/trophy/renderer.js", import.meta.url).href,
		new URL("./_build/trophy/index.js", import.meta.url).href,
		new URL("../trophy/src/renderer.js", import.meta.url).href,
		new URL("../trophy/src/index.js", import.meta.url).href,
		new URL("../trophy/dist/index.js", import.meta.url).href,
	];
	for (const h of hrefCandidates) {
		try {
			const mod = await import(h);
			const fn =
				mod.renderTrophySVG ?? mod.default?.renderTrophySVG ?? mod.default;
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
		console.warn(
			"trophy: renderer not found; attempted candidates:",
			failures.map((f) => `${f.spec}: ${f.err}`),
		);
	} catch {}
	throw new Error("trophy renderer not found (tried src and dist paths)");
}

export default async function renderWrapper(opts: any): Promise<string> {
	const fn = await loadRenderer();
	if (typeof fn !== "function")
		throw new Error("trophy renderer not available");
	return fn(opts);
}
