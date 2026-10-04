import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, describe, expect, it, vi } from "vitest";
import { restoreMocks } from "../_mockHelpers";
import { makeReq, makeRes } from "../_testShim";

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

describe("leetcode theme/cache parity", () => {
	afterEach(() => {
		restoreMocks();
		seenOptions = null;
	});

	it("falls back to the default theme when the name is unsupported", async () => {
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
		// The unsupported name is dropped, so the route's own default applies.
		// That default used to be the dual pair `{ light: "light", dark: "dark" }`,
		// which meant a typo silently produced a light/dark card rather than the
		// theme that was asked for - and which also takes the dual-theme code path
		// where a theme's gradient defs are involved. It is a single theme now.
		expect(seenOptions.theme).toBe("default");
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
		const res = makeRes();
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
