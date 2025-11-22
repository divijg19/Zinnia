import { vi } from "vitest";

/**
 * Returns a factory suitable for `vi.doMock('../../api/_utils', factory)`
 * to mock trophy cache helpers and a few utility functions used by handlers.
 *
 * Example:
 *   vi.resetModules();
 *   vi.doMock('../../api/_utils', mockApiUtilsFactory({ readMeta: { body: 'X', etag: 'e' } }));
 *   const mod = await import('../../api/trophy.js');
 */
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
	const writeImpl = writeSpy ?? vi.fn(async () => {});
	const readImpl = readSpy ?? vi.fn(async () => readBody);
	const readMetaImpl = vi.fn(async () =>
		readMeta
			? readMeta
			: readBody
				? { body: readBody, etag: computeEtag(readBody) }
				: null,
	);

	return () => ({
		computeCacheKey: (u: string) => {
			// stable short key for tests
			return (u || "").slice(0, 16).replace(/[^a-z0-9]/gi, "_");
		},
		computeEtag: (b: string) => computeEtag(b),
		readTrophyCache: readImpl,
		readTrophyCacheWithMeta: readMetaImpl,
		writeTrophyCacheWithMeta: writeImpl,
		writeTrophyCache: writeImpl,
		// validation & theme helpers (lightweight implementations)
		isValidUsername: (username: string | null | undefined) => {
			if (!username) return false;
			return /^[A-Za-z0-9-]{1,39}$/.test(String(username));
		},
		getUsername: (url: URL, keys: string[] = ["username", "user"]) => {
			for (const k of keys) {
				const v = (url as any).searchParams.get(k);
				if (v && /^[A-Za-z0-9-]{1,39}$/.test(v)) return v;
			}
			return null;
		},
		ALLOWED_THEMES: new Set([
			"watchdog",
			"light",
			"dark",
			"onedark",
			"dracula",
			"radical",
			"tokyonight",
			"merko",
			"github_dark",
		]),
		filterThemeParam: (url: URL, key = "theme") => {
			const raw = (url as any).searchParams.get(key);
			if (!raw) return;
			const value = String(raw).trim().toLowerCase();
			if (
				![...new Set(["watchdog", "light", "dark"])].includes(value) &&
				!value.includes(",")
			) {
				(url as any).searchParams.delete(key);
			}
		},
		// header helpers (implement minimally so handlers behave as in prod)
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
				res.setHeader("ETag", etag);
			} catch (_e) {
				// ignore
			}
			const inm = (reqHeaders["if-none-match"] ??
				reqHeaders["If-None-Match"]) as string | string[] | undefined;
			const inmValue = Array.isArray(inm) ? inm[0] : inm;
			if (inmValue && inmValue === etag) {
				res.status(304);
				return true;
			}
			return false;
		},
	});
}

export function restoreMocks() {
	vi.restoreAllMocks();
	vi.resetModules();
}
