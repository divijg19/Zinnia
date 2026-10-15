import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Resolve a compiled handler by testing common candidate filenames and extensions.
// Returns the first existing absolute path or undefined.
export function resolveCompiledHandler(
	metaUrl: string,
	...segments: string[]
): string | undefined {
	// `fileURLToPath` is the correct inverse of `pathToFileURL`: it decodes
	// percent-escapes and returns a native path (drive letter included) on every
	// platform. `new URL(metaUrl).pathname` left a leading slash before a Windows
	// drive (`/C:/...`) and kept URI encoding, which the loader then had to undo
	// with a pile of string surgery.
	const base = path.dirname(fileURLToPath(metaUrl));

	const candidates: string[] = [];
	// Resolve from the caller module first, then from the repository root, to
	// cover environments where `import.meta.url` paths differ (vercel dev,
	// bundlers).
	for (const root of [base, process.cwd()]) {
		const target = path.resolve(root, ...segments);
		candidates.push(
			target,
			target.replace(/\.js$/i, ".mjs"),
			target.replace(/\.js$/i, ".cjs"),
			path.join(target, "index.js"),
			path.join(target, "index.mjs"),
		);
	}

	for (const candidate of candidates) {
		try {
			if (fs.existsSync(candidate)) {
				if (process.env.LOADER_DEBUG === "1")
					console.debug("loader: selected renderer spec =>", candidate);
				return candidate;
			}
		} catch {
			// An unreadable candidate is just a miss; try the next one.
		}
	}

	if (process.env.LOADER_DEBUG === "1")
		console.debug("loader: no candidate matched =>", candidates);
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
