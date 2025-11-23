import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

// Generic cache module used by multiple SVG proxy handlers. Each service may
// override its cache directory by setting `${SERVICE}_CACHE_DIR` env var (e.g.
// TROPHY_CACHE_DIR or STREAK_CACHE_DIR). A global `CACHE_DIR` env var can also
// be used as a fallback base.

function computeKeyFromUrl(url: string): string {
	const h = crypto.createHash("sha1").update(url, "utf8").digest("hex");
	return h.slice(0, 16);
}

function serviceCacheDir(service: string): string {
	const svcEnv = `${service.toUpperCase()}_CACHE_DIR`;
	if (process.env[svcEnv]) return path.resolve(process.env[svcEnv] as string);
	if (process.env.CACHE_DIR)
		return path.resolve(process.env.CACHE_DIR as string, service);
	return path.join(process.cwd(), "cache", service);
}

async function ensureCacheDir(service: string): Promise<void> {
	const dir = serviceCacheDir(service);
	// During tests prefer not to create a repo-level `cache/` unless a
	// service-specific env var is provided. Tests will typically set
	// `<SERVICE>_CACHE_DIR` or `VITEST_WORKER_ID`.
	if (
		!process.env[`${service.toUpperCase()}_CACHE_DIR`] &&
		(process.env.VITEST_WORKER_ID || process.env.NODE_ENV === "test")
	) {
		return;
	}
	try {
		await fs.mkdir(dir, { recursive: true });
	} catch (_e) {
		// best-effort
	}
}

export async function writeCache(
	service: string,
	url: string,
	body: string,
): Promise<void> {
	try {
		await ensureCacheDir(service);
		const key = computeKeyFromUrl(url);
		const file = path.join(serviceCacheDir(service), `${key}.svg`);
		await fs.writeFile(file, body, "utf8");
	} catch (_e) {
		// best-effort
	}
}

export async function readCache(
	service: string,
	url: string,
): Promise<string | null> {
	try {
		const key = computeKeyFromUrl(url);
		const file = path.join(serviceCacheDir(service), `${key}.svg`);
		const data = await fs.readFile(file, "utf8");
		return data;
	} catch (_e) {
		return null;
	}
}

export async function writeCacheWithMeta(
	service: string,
	url: string,
	body: string,
	etag: string,
): Promise<void> {
	try {
		await ensureCacheDir(service);
		const key = computeKeyFromUrl(url);
		const file = path.join(serviceCacheDir(service), `${key}.svg`);
		const metaFile = path.join(serviceCacheDir(service), `${key}.meta.json`);
		await fs.writeFile(file, body, "utf8");
		const meta = { etag, ts: Date.now() };
		await fs.writeFile(metaFile, JSON.stringify(meta), "utf8");
	} catch (_e) {
		// best-effort
	}
}

export async function readCacheWithMeta(
	service: string,
	url: string,
): Promise<{ body: string; etag?: string; ts?: number } | null> {
	try {
		const key = computeKeyFromUrl(url);
		const file = path.join(serviceCacheDir(service), `${key}.svg`);
		const metaFile = path.join(serviceCacheDir(service), `${key}.meta.json`);
		const body = await fs.readFile(file, "utf8");
		try {
			const raw = await fs.readFile(metaFile, "utf8");
			const parsed = JSON.parse(raw);
			return { body, etag: parsed.etag, ts: parsed.ts };
		} catch (_e) {
			return { body };
		}
	} catch (_e) {
		return null;
	}
}

export function computeEtag(body: string): string {
	const hash = crypto.createHash("sha1").update(body, "utf8").digest("hex");
	return hash.slice(0, 16);
}

export { computeKeyFromUrl as computeCacheKey };
