// Lightweight wrapper that locates and returns the trophy renderer at runtime.
// This tries compiled JS bundles first (what Vercel deploys) and falls back
// to source paths for local development. It returns an async loader that
// resolves to a function `(cfg) => string`.

let _renderer: ((cfg: any) => string) | null = null;

async function tryImportCandidates(base: string) {
	const candidates = [
		`${base}.js`,
		`${base}.ts`,
		`${base}/index.js`,
		`${base}/index.ts`,
		base,
	];
	for (const c of candidates) {
		try {
			// dynamic import may throw; prefer the .js compiled bundle in prod
			// but accept .ts or bare module during local dev.
			// Note: some bundles export an HTTP handler as default; we only
			// accept modules that expose `renderTrophySVG`.
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const mod = await import(c);
			if (mod?.renderTrophySVG) return mod.renderTrophySVG;
		} catch {
			// try next
		}
	}
	return null;
}

export default async function loadRenderer(): Promise<(cfg: any) => string> {
	if (_renderer !== null) return _renderer;

	// Prefer compiled outputs typically emitted by the trophy subrepo.
	const candidates = [
		"../trophy/api/dist/index",
		"../trophy/dist/index",
		"../trophy/api/index",
		// fall back to source renderer
		"../trophy/src/renderer",
		"../trophy/src/renderer.js",
	];

	for (const base of candidates) {
		const r = await tryImportCandidates(base);
		if (r !== null) {
			_renderer = r;
			return r;
		}
	}

	throw new Error("trophy renderer module not found");
}
