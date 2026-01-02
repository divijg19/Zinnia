import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Resolve a compiled handler by testing common candidate filenames and extensions.
// Returns the first existing absolute path or undefined.
export function resolveCompiledHandler(
	metaUrl: string,
	...segments: string[]
): string | undefined {
	const base = path.resolve(path.dirname(new URL(metaUrl).pathname));
	const candidates: string[] = [];
	const failed: Array<{ spec: string; err: string }> = [];

	// primary target relative to the caller module
	const target = path.resolve(base, ...segments);
	candidates.push(target);
	candidates.push(target.replace(/\.js$/i, ".mjs"));
	candidates.push(target.replace(/\.js$/i, ".cjs"));
	candidates.push(path.join(target, "index.js"));
	candidates.push(path.join(target, "index.mjs"));

	// also try resolving from repository root (process.cwd()) to account for
	// environments where import.meta.url paths differ (vercel dev, bundlers)
	try {
		const rootTarget = path.resolve(process.cwd(), ...segments);
		candidates.push(rootTarget);
		candidates.push(rootTarget.replace(/\.js$/i, ".mjs"));
		candidates.push(rootTarget.replace(/\.js$/i, ".cjs"));
		candidates.push(path.join(rootTarget, "index.js"));
		candidates.push(path.join(rootTarget, "index.mjs"));
	} catch {}

	for (const c of candidates) {
		try {
			// build a small set of alternative candidate paths to handle
			// common Windows drive-letter leading slash issues and
			// non-absolute candidates that should be resolved from CWD.
			const toTry: string[] = [c];
			// If candidate looks like an absolute path with a leading
			// slash followed by a drive letter ("/C:/..."), try the
			// same path without the leading slash.
			if (/^\/[A-Za-z]:\\|^\/[A-Za-z]:\//.test(c)) {
				toTry.push(c.slice(1));
			}
			// If candidate is not absolute, also try resolving from process.cwd()
			if (!path.isAbsolute(c)) {
				try {
					toTry.push(path.resolve(process.cwd(), c));
				} catch {}
			}

			const found = false;
			for (const trial of toTry) {
				try {
					// Normalize the trial path for the current platform
					const normalized = path.normalize(trial);

					// Try the normalized path first
					if (fs.existsSync(normalized)) {
						if (process.env.LOADER_DEBUG === "1")
							console.debug("loader: selected renderer spec =>", normalized);
						return normalized;
					}

					// If path starts with a leading slash before a drive letter, strip it
					const leadingSlashDrive = normalized.replace(
						/^[/\\]([A-Za-z]:[/\\].*)$/,
						"$1",
					);
					if (
						leadingSlashDrive !== normalized &&
						fs.existsSync(leadingSlashDrive)
					) {
						if (process.env.LOADER_DEBUG === "1")
							console.debug(
								"loader: selected renderer spec =>",
								leadingSlashDrive,
							);
						return leadingSlashDrive;
					}

					// Try swapping slash directions as a last resort
					const swapSlashes = normalized.includes("\\")
						? normalized.replace(/\\/g, "/")
						: normalized.replace(/\//g, "\\");
					if (fs.existsSync(swapSlashes)) {
						if (process.env.LOADER_DEBUG === "1")
							console.debug("loader: selected renderer spec =>", swapSlashes);
						return swapSlashes;
					}

					// Try converting to a file URL and back (handles some URI encodings)
					try {
						const p = pathToFileURL(normalized).pathname;
						if (fs.existsSync(p)) {
							if (process.env.LOADER_DEBUG === "1")
								console.debug("loader: selected renderer spec =>", p);
							return p;
						}
						const pNoLeading = p.replace(/^\/+/, "");
						if (pNoLeading !== p && fs.existsSync(pNoLeading)) {
							if (process.env.LOADER_DEBUG === "1")
								console.debug("loader: selected renderer spec =>", pNoLeading);
							return pNoLeading;
						}
					} catch {
						// ignore file URL conversion errors
					}
				} catch (err) {
					failed.push({ spec: trial, err: String(err) });
				}
			}
			if (!found) failed.push({ spec: c, err: `not found` });
		} catch (err) {
			failed.push({ spec: c, err: String(err) });
		}
	}

	if (process.env.LOADER_DEBUG === "1") {
		console.debug("loader: found candidates =>", candidates);
		console.debug("loader: failed candidates =>", failed);
	}
	return undefined;
}

// Import a module given an absolute filesystem path. Returns the imported module.
export async function importByPath(absPath: string) {
	const url = pathToFileURL(absPath).href;
	return await import(url);
}

/**
 * Pick a callable handler from an imported module.
 * Tries in-order the names provided and finally falls back to the module itself
 * if it is a function. Returns { fn, name } or undefined.
 */
export function pickHandlerFromModule(mod: any, names: string[]) {
	try {
		const keys = Object.keys(mod || {});
		if (process.env.LOADER_DEBUG === "1")
			console.debug("loader: module export keys ->", keys);
	} catch (_) {}

	for (const n of names) {
		if (n === "default" && typeof mod?.default === "function")
			return { fn: mod.default, name: "default" };
		if (typeof mod?.[n] === "function") return { fn: mod[n], name: n };
	}
	if (typeof mod === "function") return { fn: mod, name: "module" };
	return undefined;
}

/**
 * Invoke a handler that may accept either (req, res) or (req).
 * If the handler returns a Response (web standard) we return it, otherwise
 * we return whatever the handler returned.
 */
export async function invokePossibleRequestHandler(
	fn: (...args: unknown[]) => unknown,
	req: Request,
	res?: unknown,
) {
	// Prefer calling as (req, res) when function declares two parameters
	if ((fn as any).length >= 2) {
		const maybe = (fn as any)(req, res);
		if (maybe && typeof (maybe as any).then === "function")
			await (maybe as Promise<unknown>);
		return maybe;
	}
	// Otherwise call as (req) and expect a Response-like object
	return await (fn as any)(req);
}

export default {
	resolveCompiledHandler,
	importByPath,
	pickHandlerFromModule,
	invokePossibleRequestHandler,
};
