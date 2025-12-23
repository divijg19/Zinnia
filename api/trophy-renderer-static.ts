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
	// Prefer local source renderer first so the repository's canonical implementation
	// is used during development and CI. Keep _build and dist outputs as fallbacks.
	const specCandidates = [
		"../trophy/src/renderer",
		"../trophy/src/index",
		"./_build/trophy/renderer",
		"./_build/trophy/index",
		"../trophy/dist/index.js",
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

	// No URL-based fallbacks — keep resolution simple and deterministic.

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
