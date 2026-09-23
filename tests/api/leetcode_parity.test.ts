import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, describe, expect, it, vi } from "vitest";
import { restoreMocks } from "../_mockHelpers";

let seenOptions: any = null;

class FakeGenerator {
	verbose = false;
	async generate(sanitized: any) {
		seenOptions = sanitized;
		return "<svg>LC</svg>";
	}
}

function mockLeetcodeCore() {
	const loaderMock = () => ({
		resolveCompiledHandler: () => "/fake/leetcode-core.js",
		importByPath: async () => ({
			Generator: FakeGenerator,
			FontExtension: () => {},
			AnimationExtension: () => {},
			ThemeExtension: () => {},
			HeatmapExtension: () => {},
			ActivityExtension: () => {},
			ContestExtension: () => {},
		}),
		pickHandlerFromModule: () => null,
		invokePossibleRequestHandler: async () => null,
	});
	vi.doMock("../../lib/loader/index.js", loaderMock);
	vi.doMock("../../lib/loader/index", loaderMock);
}

function makeReq(urlPath: string) {
	return {
		headers: { host: "localhost", "x-forwarded-proto": "http" },
		method: "GET",
		url: urlPath,
	} as unknown as Record<string, unknown>;
}

function makeRes() {
	const headers = new Map<string, string>();
	return {
		setHeader: vi.fn((k: string, v: unknown) => {
			headers.set(String(k).toLowerCase(), String(v));
		}),
		send: vi.fn(),
		status: vi.fn().mockReturnThis(),
		_headers: headers,
	} as unknown as Record<string, unknown>;
}

describe("leetcode theme/cache parity", () => {
	afterEach(() => {
		restoreMocks();
		seenOptions = null;
	});

	it("filters unsupported single themes to the default", async () => {
		vi.resetModules();
		mockLeetcodeCore();
		const leetcode = (await import("../../api/leetcode.js")).default;
		const res = makeRes();
		await leetcode(
			makeReq(
				"/api/leetcode?username=lcuser&theme=nosuchtheme",
			) as unknown as VercelRequest,
			res as unknown as VercelResponse,
		);

		expect(res.send).toHaveBeenCalledWith("<svg>LC</svg>");
		// Filtered out: preset dual default applies, unsupported name dropped.
		expect(seenOptions.theme).toEqual({ light: "light", dark: "dark" });
	});

	it("passes supported themes through", async () => {
		vi.resetModules();
		mockLeetcodeCore();
		const leetcode = (await import("../../api/leetcode.js")).default;
		await leetcode(
			makeReq(
				"/api/leetcode?username=lcuser&theme=dark",
			) as unknown as VercelRequest,
			makeRes() as unknown as VercelResponse,
		);

		expect(seenOptions.theme).toBe("dark");
	});

	it("clamps ?cache= to the documented range", async () => {
		vi.resetModules();
		mockLeetcodeCore();
		const leetcode = (await import("../../api/leetcode.js")).default;
		const res = makeRes() as unknown as Record<string, unknown> & {
			_headers: Map<string, string>;
		};
		await leetcode(
			makeReq(
				"/api/leetcode?username=lcuser&cache=99999999",
			) as unknown as VercelRequest,
			res as unknown as VercelResponse,
		);

		const cc = res._headers.get("cache-control") ?? "";
		const m = cc.match(/max-age=(\d+)/);
		expect(m).toBeTruthy();
		expect(Number(m?.[1])).toBeLessThanOrEqual(604800);
	});
});
