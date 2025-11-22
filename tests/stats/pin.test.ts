import { afterEach, describe, expect, it, vi } from "vitest";
import { headerValue, makeReq, makeRes } from "../_resShim";

afterEach(() => {
	vi.resetModules();
	vi.restoreAllMocks();
});

describe("stats pin handler", () => {
	it("renders repo card, sets SVG and cache headers", async () => {
		const sampleRepo = {
			name: "repo",
			nameWithOwner: "owner/repo",
			description: "A sample repo",
			primaryLanguage: { name: "TypeScript", color: "#3178c6" },
			isArchived: false,
			isTemplate: false,
			starCount: 1234,
			forkCount: 10,
		};

		// Mock fetcher that returns repo data
		vi.doMock("../../stats/src/fetchers/repo", () => ({
			fetchRepo: vi.fn(async () => sampleRepo),
		}));

		// Mock access guard to always allow
		vi.doMock("../../stats/src/common/access", () => ({
			guardAccess: () => ({ isPassed: true }),
		}));

		// Minimal api-utils mocks: setSvgHeaders, validateLocale and error handler
		vi.doMock("../../stats/src/common/api-utils", () => ({
			handleApiError: (opts: any) => opts.res.send("ERR"),
			setSvgHeaders: (res: any) => {
				res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
				res.setHeader("X-Content-Type-Options", "nosniff");
			},
			validateLocale: () => false,
		}));

		// Mock cache helpers to assert cache header behavior
		vi.doMock("../../stats/src/common/cache", () => ({
			CACHE_TTL: { PIN_CARD: { DEFAULT: 3600, MIN: 60, MAX: 86400 } },
			resolveCacheSeconds: () => 60,
			setCacheHeaders: (res: any, sec: number) =>
				res.setHeader("Cache-Control", `max-age=${sec}`),
		}));

		const mod = await import("../../stats/api/pin.js");
		const handler = mod.default;

		const req = makeReq("/api/pin?username=owner&repo=repo");
		// Vercel handlers expect a `query` object on the request
		req.query = { username: "owner", repo: "repo", cache_seconds: "60" };
		const res = makeRes();

		await handler(req, res);

		expect(headerValue(res, "Content-Type")).toBe(
			"image/svg+xml; charset=utf-8",
		);
		expect(headerValue(res, "Cache-Control")).toContain("max-age=60");
		expect(res.send).toHaveBeenCalled();

		const body = res.send.mock.calls[0][0];
		expect(typeof body).toBe("string");
		// Repo name should be included and the stargazers label should be present
		expect(body).toContain("repo");
		expect(body).toContain("stargazers");
	});

	it("should render a pinned repo card and set headers", async () => {
		const sampleRepo = {
			name: "repo",
			nameWithOwner: "me/repo",
			description: "desc",
			primaryLanguage: { name: "TS", color: "#123" },
			isArchived: false,
			isTemplate: false,
			starCount: 10,
			forkCount: 0,
		};

		vi.doMock("../../stats/src/fetchers/repo", () => ({
			fetchRepo: async () => sampleRepo,
		}));

		const mod = await import("../../stats/api/pin.js");
		const handler = mod.default;

		const req: any = { query: { username: "me", repo: "repo" }, headers: {} };
		const res: any = {
			setHeader: vi.fn(),
			status: vi.fn(() => res),
			send: vi.fn(),
		};

		await handler(req, res);

		expect(res.setHeader).toHaveBeenCalled();
		expect(res.send).toHaveBeenCalled();
	});
});
