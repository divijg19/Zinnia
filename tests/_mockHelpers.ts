import { vi } from "vitest";

/** Test helpers: mock `api/_utils` factory and `api/cache` shim. */

export function mockApiUtilsFactory({
	readBody = null,
	readMeta = null,
	writeSpy = undefined,
	readSpy = undefined,
	computeEtag = (b: string) => (b ? String(b).slice(0, 16) : "mock-etag"),
}: {
	readBody?: string | null;
	readMeta?: { body: string; etag: string } | null;
	writeSpy?: any;
	readSpy?: any;
	computeEtag?: (b: string) => string;
} = {}) {
	const writeImpl = writeSpy ?? vi.fn(async () => { });
	const readImpl = readSpy ?? vi.fn(async () => readBody);
	const readMetaImpl = vi.fn(async () =>
		readMeta
			? readMeta
			: readBody
				? { body: readBody, etag: computeEtag(readBody) }
				: null,
	);

	return () => {
		// Mock `api/cache` as well so handlers that import it directly are
		// covered by tests that only mock `api/_utils`.
		const cacheMock = () => ({
			computeCacheKey: (u: string) =>
				(u || "").slice(0, 16).replace(/[^a-z0-9]/gi, "_"),
			computeEtag: (b: string) => computeEtag(b),
			readCache: readImpl,
			readCacheWithMeta: readMetaImpl,
			writeCache: writeImpl,
			writeCacheWithMeta: writeImpl,
		});
		vi.doMock("../../api/cache", cacheMock);
		// Some bundlers/resolvers include the .js extension in module ids;
		// register the variant as well so the mock is applied consistently.
		vi.doMock("../../api/cache.js", cacheMock);

		return {
			computeCacheKey: (u: string) =>
				(u || "").slice(0, 16).replace(/[^a-z0-9]/gi, "_"),
			computeEtag: (b: string) => computeEtag(b),
			readTrophyCache: readImpl,
			readTrophyCacheWithMeta: readMetaImpl,
			writeTrophyCacheWithMeta: writeImpl,
			writeTrophyCache: writeImpl,
			isValidUsername: (username: string | null | undefined) => {
				if (!username) return false;
				return /^[A-Za-z0-9-]{1,39}$/.test(String(username));
			},
			getUsername: (url: URL, keys: string[] = ["username", "user"]) => {
				for (const k of keys) {
					const v = (url as unknown as URL).searchParams.get(k);
					if (v && /^[A-Za-z0-9-]{1,39}$/.test(v)) return v;
				}
				return null;
			},
			ALLOWED_THEMES: new Set(["watchdog", "light", "dark", "onedark"]),
			filterThemeParam: (url: URL, key = "theme") => {
				const raw = (url as unknown as URL).searchParams.get(key);
				if (!raw) return;
				const value = String(raw).trim().toLowerCase();
				if (
					![...new Set(["watchdog", "light", "dark"])].includes(value) &&
					!value.includes(",")
				) {
					(url as unknown as URL).searchParams.delete(key);
				}
			},
			resolveCacheSeconds: () => 86400,
			setCacheHeaders: (res: any, seconds: number) => {
				try {
					res.setHeader(
						"Cache-Control",
						`public, max-age=${seconds}, s-maxage=${seconds}, stale-while-revalidate=43200, must-revalidate`,
					);
				} catch (_e) {
					// ignore
				}
			},
			setSvgHeaders: (res: any) => {
				try {
					res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
					res.setHeader("X-Content-Type-Options", "nosniff");
					res.setHeader("Vary", "Accept-Encoding");
				} catch (_e) {
					// ignore
				}
			},
			setShortCacheHeaders: (res: any, seconds = 60) => {
				try {
					const s = Math.max(0, Math.min(seconds, 3600));
					res.setHeader(
						"Cache-Control",
						`public, max-age=${s}, s-maxage=${s}, stale-while-revalidate=30, must-revalidate`,
					);
					res.setHeader("X-Cache-Status", "transient");
				} catch (_e) {
					// ignore
				}
			},
			setFallbackCacheHeaders: (res: any, seconds: number) => {
				try {
					const s = Math.max(60, Math.min(seconds, 604800));
					const swr = Math.min(86400, Math.max(60, Math.floor(s / 2)));
					res.setHeader(
						"Cache-Control",
						`public, max-age=${s}, s-maxage=${s}, stale-while-revalidate=${swr}`,
					);
					res.setHeader("X-Cache-Status", "fallback");
				} catch (_e) {
					// ignore
				}
			},
			setEtagAndMaybeSend304: (
				reqHeaders: Record<string, unknown>,
				res: any,
				body: string,
			) => {
				const etag = computeEtag(body);
				try {
					res.setHeader("ETag", `"${etag}"`);
				} catch (_e) {
					// ignore
				}
				const inm = (reqHeaders["if-none-match"] ??
					reqHeaders["If-None-Match"]) as string | string[] | undefined;
				const inmValue = Array.isArray(inm) ? inm[0] : inm;
				if (inmValue) {
					const norm = String(inmValue)
						.replace(/^W\//i, "")
						.replace(/^"|"$/g, "");
					if (norm === etag) {
						res.status(304);
						return true;
					}
				}
				return false;
			},
		};
	};
}

export function restoreMocks() {
	vi.restoreAllMocks();
	vi.resetModules();
}

// Canonical streak mock specifier and convenience helper
export const STREAK_DIST_MOCK_ID = "../../streak/dist/index";

export function mockStreakRenderer(mockExport: unknown) {
	const moduleMock = typeof mockExport === "function" ? { default: mockExport } : mockExport;
	// expose global fallback used by loader to make tests deterministic
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(globalThis as any).__STREAK_TEST_RENDERER = moduleMock;
	} catch { }
	vi.doMock(STREAK_DIST_MOCK_ID, () => moduleMock as any);
	vi.doMock(`${STREAK_DIST_MOCK_ID}.js`, () => moduleMock as any);
	vi.doMock(`${STREAK_DIST_MOCK_ID}.mjs`, () => moduleMock as any);
}
