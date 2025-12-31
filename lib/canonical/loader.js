// Runtime JS shim for lib/canonical/loader.ts
// This shim attempts to import a number of likely build/source locations
// and normalizes different bundle export shapes into a consistent
// `{ loadStreakRenderer, renderFallbackSvg }` surface.

function pickRendererExport(mod) {
	if (!mod) return null;
	// If module already exposes the desired helpers, use them.
	if (typeof mod.loadStreakRenderer === "function")
		return {
			loadStreakRenderer: mod.loadStreakRenderer,
			renderFallbackSvg: mod.renderFallbackSvg,
		};
	if (
		typeof mod.renderFallbackSvg === "function" &&
		typeof mod.loadStreakRenderer === "function"
	)
		return {
			loadStreakRenderer: mod.loadStreakRenderer,
			renderFallbackSvg: mod.renderFallbackSvg,
		};

	// Try common shapes: explicit named `renderForUser` or `render`
	if (typeof mod.renderForUser === "function") {
		return {
			loadStreakRenderer: async () => mod.renderForUser,
			renderFallbackSvg: mod.renderFallbackSvg,
		};
	}
	if (mod.default && typeof mod.default.renderForUser === "function") {
		return {
			loadStreakRenderer: async () =>
				mod.default.renderForUser.bind(mod.default),
			renderFallbackSvg: mod.default.renderFallbackSvg || mod.renderFallbackSvg,
		};
	}

	// Default export as function
	if (typeof mod.default === "function") {
		return {
			loadStreakRenderer: async () => mod.default,
			renderFallbackSvg: mod.renderFallbackSvg,
		};
	}

	// Top-level function export
	if (typeof mod === "function") {
		return {
			loadStreakRenderer: async () => mod,
			renderFallbackSvg: undefined,
		};
	}

	// Common alternative names
	if (typeof mod.handler === "function")
		return {
			loadStreakRenderer: async () => mod.handler,
			renderFallbackSvg: mod.renderFallbackSvg,
		};
	if (typeof mod.render === "function")
		return {
			loadStreakRenderer: async () => mod.render,
			renderFallbackSvg: mod.renderFallbackSvg,
		};

	return null;
}

async function resolveLoaderModule() {
	const candidates = [
		// Prefer the local built bundle that tests/dev helper imports (streak/dist)
		"../../streak/dist/index.js",
		"../../streak/dist/index.mjs",
		"../../streak/dist/index",
		// Try the source loader (works when ts-node is active in dev)
		"../../streak/src/loader.js",
		"../../streak/src/loader.ts",
		// API build outputs (used in some deploys)
		"../../api/_build/streak/index.js",
		"../../api/_build/streak/index.mjs",
		// Legacy/source entries
		"../../streak/src/index.js",
		"../../streak/src/index",
	];

	const failures = [];
	const found = [];
	for (const spec of candidates) {
		// First try dynamic ESM import of the spec as provided
		try {
			const mod = await import(spec);
			const normalized = pickRendererExport(mod);
			if (normalized) {
				found.push({ spec, normalized });
				continue;
			}
			failures.push({ spec, err: "no renderer export" });
		} catch (err) {
			// Record the import error and continue trying other resolution strategies
			try {
				failures.push({ spec, err: String(err) });
			} catch {
				failures.push({ spec, err: "import failed" });
			}

			// Try to resolve as a file:// URL relative to this module and import that
			try {
				const url = new URL(spec, import.meta.url).href;
				try {
					const mod = await import(url);
					const normalized = pickRendererExport(mod);
					if (normalized) {
						found.push({ spec: url, normalized });
						continue;
					}
					failures.push({ spec: url, err: "no renderer export" });
				} catch (e) {
					try {
						failures.push({ spec: url, err: String(e) });
					} catch {
						failures.push({ spec: url, err: "import failed" });
					}
				}
			} catch {
				/* ignore URL resolution errors */
			}

			// As a last resort, attempt a CommonJS `require` using createRequire
			try {
				// Lazily require these to avoid top-level import changes in environments
				const { createRequire } = await import("node:module");
				const require = createRequire(import.meta.url);
				let resolvedPath;
				try {
					// Try resolving the spec relative to this module
					resolvedPath = require.resolve(spec, { paths: [process.cwd()] });
				} catch {
					try {
						const maybe = new URL(spec, import.meta.url).pathname;
						resolvedPath = maybe;
					} catch {
						resolvedPath = spec;
					}
				}
				try {
					const mod = require(resolvedPath);
					const normalized = pickRendererExport(mod);
					if (normalized) {
						found.push({ spec: resolvedPath, normalized });
						continue;
					}
					failures.push({
						spec: resolvedPath,
						err: "no renderer export (CJS)",
					});
				} catch (e) {
					try {
						failures.push({ spec: resolvedPath, err: String(e) });
					} catch {
						failures.push({ spec: resolvedPath, err: "require failed" });
					}
				}
			} catch {
				/* ignore require fallback failures */
			}
		}
	}
	// Debug: log all importable candidates and failures to aid diagnosis
	try {
		// eslint-disable-next-line no-console
		console.debug(
			"loader: found candidates =>",
			found.map((f) => f.spec),
		);
		// eslint-disable-next-line no-console
		console.debug("loader: failed candidates =>", failures.slice(0, 6));
	} catch {}

	// If we found multiple candidates, prefer the built `streak/dist` bundle
	if (found.length > 0) {
		// If no `streak/dist` candidate is present, attempt an absolute file:// import
		const hasDist = found.some((f) => /streak[\\/]dist[\\/]/.test(f.spec));
		if (!hasDist) {
			try {
				const alt = new URL("../../streak/dist/index.js", import.meta.url).href;
				try {
					const mod = await import(alt);
					const normalized = pickRendererExport(mod);
					if (normalized) {
						try {
							globalThis.__STREAK_RENDERER_SPEC = alt;
							// eslint-disable-next-line no-console
							console.debug(
								"loader: selected renderer spec via file:// =>",
								alt,
							);
						} catch {}
						return normalized;
					}
				} catch (e) {
					try {
						failures.push({ spec: alt, err: String(e) });
					} catch {
						failures.push({ spec: alt, err: "import failed" });
					}
				}
			} catch {
				/* ignore URL resolution errors */
			}
		}

		const preferred =
			found.find((f) => /streak[\\/]dist[\\/]/.test(f.spec)) || found[0];
		try {
			globalThis.__STREAK_RENDERER_SPEC = preferred.spec;
			// eslint-disable-next-line no-console
			console.debug("loader: selected renderer spec =>", preferred.spec);
		} catch {}
		return preferred.normalized;
	}
	// If nothing matched, throw with diagnostics
	// Attach diagnostic to global so callers can observe what was attempted.
	try {
		globalThis.__STREAK_RENDERER_SPEC = JSON.stringify(
			failures.map((f) => f.spec),
		);
		// eslint-disable-next-line no-console
		console.debug("loader: failed candidates =>", failures.slice(0, 5));
	} catch {}
	throw new Error(
		"loader: could not locate streak loader module; attempts: " +
			JSON.stringify(failures),
	);
}

// Defer resolution to avoid require-cycle errors: resolve when first requested.
let _cached = null;

export async function loadStreakRenderer() {
	if (_cached?.__wrappedRenderer) return _cached.__wrappedRenderer;
	const normalized = _cached || (await resolveLoaderModule());
	_cached = normalized;

	// Obtain the raw renderer function from the normalized module.
	const rawFactory = normalized.loadStreakRenderer;
	if (typeof rawFactory !== "function") {
		// Fallback: if the normalized export is unexpected, throw so callers can handle.
		throw new Error(
			"loader: normalized module has no loadStreakRenderer factory",
		);
	}

	const rendererFn = await rawFactory();
	if (typeof rendererFn !== "function") {
		throw new Error("loader: resolved renderer is not a function");
	}

	// Wrap renderer to normalize return shapes and provide defaults.
	const wrapped = async (...args) => {
		const out = await rendererFn(...args);
		// If renderer returned a raw string, treat it as SVG
		if (typeof out === "string") {
			return { status: 200, body: out, contentType: "image/svg+xml" };
		}
		// If renderer returned a Buffer, assume PNG fallback
		if (
			typeof Buffer !== "undefined" &&
			Buffer.isBuffer &&
			Buffer.isBuffer(out)
		) {
			return { status: 200, body: out, contentType: "image/png" };
		}
		// If renderer returned an object-like thing, normalize
		if (out && typeof out === "object") {
			const body = out.body ?? out;
			const contentType =
				out.contentType ||
				(typeof body === "string" ? "image/svg+xml" : undefined);
			return { status: out.status || 200, body, contentType };
		}
		// Fallback to an empty SVG body
		return {
			status: 200,
			body: String(out ?? ""),
			contentType: "image/svg+xml",
		};
	};

	try {
		_cached.__wrappedRenderer = wrapped;
		// Expose the selected spec for diagnostics
		try {
			globalThis.__STREAK_RENDERER_SPEC =
				globalThis.__STREAK_RENDERER_SPEC || "<resolved>";
		} catch {}
	} catch {}
	return wrapped;
}

export async function renderFallbackSvg(user) {
	try {
		if (_cached && typeof _cached.renderFallbackSvg === "function") {
			return _cached.renderFallbackSvg(user);
		}
		const normalized = await resolveLoaderModule();
		_cached = normalized;
		if (normalized && typeof normalized.renderFallbackSvg === "function") {
			return normalized.renderFallbackSvg(user);
		}
	} catch {
		/* fall through to minimal fallback */
	}
	// Minimal deterministic fallback SVG
	try {
		const escaped = String(user || "").replace(/[&<>"'`]/g, (s) => {
			switch (s) {
				case "&":
					return "&amp;";
				case "<":
					return "&lt;";
				case ">":
					return "&gt;";
				case '"':
					return "&quot;";
				case "'":
					return "&#39;";
				default:
					return s;
			}
		});
		return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="Streak for ${escaped}"><title>Streak for ${escaped}</title><rect width="100%" height="100%" fill="#0f172a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">Streak for ${escaped}</text></svg>`;
	} catch {
		return '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="Streak"><title>Streak</title></svg>';
	}
}

export default { loadStreakRenderer, renderFallbackSvg };
