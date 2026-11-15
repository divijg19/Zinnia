import { vi } from "vitest";
// The real module, imported eagerly so the mock factory can be synchronous:
// `vi.doMock` checks what its factory returns before awaiting it.
import * as canonicalCardModule from "../lib/canonical/http_cache.js";

/**
 * Test helpers: mock the cache layer and the canonical card module.
 */

/**
 * Mock the canonical card module for a route test.
 *
 * The module keeps its real behaviour - the header contract, the theme
 * filter, the response helpers - because that behaviour is what the route is
 * supposed to produce. Only the two things a test cannot control are stubbed:
 * the etag, so it is deterministic, and the cache adapter, so nothing is
 * read from or written to the filesystem.
 *
 * The previous version of this helper re-implemented the module's surface by
 * hand, which meant the mock could drift from the implementation it stood in
 * for: a change to the real `Cache-Control` would have left the mock
 * emitting the old one, and the tests would have passed.
 */
export function mockCardModuleFactory({
	readBody = null,
	readMeta = null,
	writeSpy = undefined,
	computeEtag = (b: string) => (b ? String(b).slice(0, 16) : "mock-etag"),
}: {
	readBody?: string | null;
	readMeta?: { body: string; etag: string } | null;
	writeSpy?: any;
	computeEtag?: (b: string) => string;
} = {}) {
	const writeImpl = writeSpy ?? vi.fn(async () => {});
	const readMetaImpl = vi.fn(async () =>
		readMeta
			? readMeta
			: readBody
				? { body: readBody, etag: computeEtag(readBody) }
				: null,
	);

	return () => {
		// The filesystem layer under the canonical module.
		const cacheMock = () => ({
			computeEtag: (b: string) => computeEtag(b),
			readCacheWithMeta: readMetaImpl,
			writeCacheWithMeta: writeImpl,
		});
		vi.doMock("../../lib/cache", cacheMock);
		// Some bundlers/resolvers include the .js extension in module ids;
		// register the variant as well so the mock is applied consistently.
		vi.doMock("../../lib/cache.js", cacheMock);

		return {
			...canonicalCardModule,
			default: canonicalCardModule.default,
			computeEtag: (b: string) => computeEtag(b),
			getCacheAdapterForService: () => ({
				get: async () => readMetaImpl(),
				set: async () => writeImpl(),
			}),
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
	const moduleMock =
		typeof mockExport === "function" ? { default: mockExport } : mockExport;
	// expose global fallback used by loader to make tests deterministic
	try {
		(globalThis as any).__STREAK_TEST_RENDERER = moduleMock;
	} catch {}
	vi.doMock(STREAK_DIST_MOCK_ID, () => moduleMock as any);
	vi.doMock(`${STREAK_DIST_MOCK_ID}.js`, () => moduleMock as any);
	vi.doMock(`${STREAK_DIST_MOCK_ID}.mjs`, () => moduleMock as any);

	// Also register mocks for the API _build locations the loader may try
	// in non-test or alternate resolution environments so tests remain
	// deterministic if the loader attempts those literal specifiers.
	vi.doMock("../api/_build/streak/index", () => moduleMock as any);
	vi.doMock("../api/_build/streak/index.js", () => moduleMock as any);
	vi.doMock("../api/_build/streak/index.mjs", () => moduleMock as any);
	vi.doMock("../api/_build/streak/index.ts", () => moduleMock as any);
}
