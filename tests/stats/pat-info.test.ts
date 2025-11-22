import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// `patInfo` is imported dynamically inside each test after mocking so the
// module picks up the mocked `request` implementation.

const successData = {
	data: {
		rateLimit: {
			remaining: 4986,
		},
	},
};

const rate_limit_error = {
	errors: [
		{
			type: "RATE_LIMITED",
			message: "API rate limit exceeded for user ID.",
		},
	],
	data: {
		rateLimit: {
			resetAt: Date.now(),
		},
	},
};

const other_error = {
	errors: [
		{
			type: "SOME_ERROR",
			message: "This is a error",
		},
	],
};

const faker = (query) => {
	const req = { query: { ...query } };
	const res = { setHeader: vi.fn(), send: vi.fn() };
	return { req, res };
};

beforeEach(() => {
	process.env = {};
	process.env.PAT_1 = "testPAT1";
	process.env.PAT_2 = "testPAT2";
	process.env.PAT_3 = "testPAT3";
	process.env.PAT_4 = "testPAT4";
});

afterEach(() => {
	vi.resetModules();
	vi.restoreAllMocks();
});

describe("Test /api/status/pat-info (vitest)", () => {
	it("should return only 'validPATs' if all PATs are valid", async () => {
		vi.doMock("../../stats/src/common/utils.ts", () => ({
			request: async (_vars, headers) => {
				const token = headers?.Authorization?.replace("bearer ", "");
				if (token === "testPAT1") return { data: rate_limit_error };
				return { data: successData };
			},
			dateDiff: () => 0,
			logger: { error: () => {} },
		}));

		const mod = await import("../../stats/api/status/pat-info.js");
		const patInfo = mod.default;
		const { req, res } = faker({}, {});
		await patInfo(req, res);

		expect(res.setHeader).toHaveBeenCalledWith(
			"Content-Type",
			"application/json",
		);
		expect(res.send).toHaveBeenCalled();
		const sent = JSON.parse(res.send.mock.calls[0][0]);
		// debug output removed
		expect(sent.validPATs).toEqual(["PAT_2", "PAT_3", "PAT_4"]);
		expect(sent.exhaustedPATs).toEqual(["PAT_1"]);
	});

	it("should return `errorPATs` if a PAT causes an error to be thrown", async () => {
		vi.doMock("../../stats/src/common/utils.ts", () => ({
			request: async (_vars, headers) => {
				const token = headers?.Authorization?.replace("bearer ", "");
				if (token === "testPAT1") return { data: other_error };
				return { data: successData };
			},
			dateDiff: () => 0,
			logger: { error: () => {} },
		}));

		const mod = await import("../../stats/api/status/pat-info.js");
		const patInfo = mod.default;
		const { req, res } = faker({}, {});
		await patInfo(req, res);

		expect(res.setHeader).toHaveBeenCalledWith(
			"Content-Type",
			"application/json",
		);
		const sent = JSON.parse(res.send.mock.calls[0][0]);
		expect(sent.errorPATs).toEqual(["PAT_1"]);
	});

	it("should return `expiredPaths` if a PAT returns a 'Bad credentials' error", async () => {
		vi.doMock("../../stats/src/common/utils.ts", () => ({
			request: async (_vars, headers) => {
				const token = headers?.Authorization?.replace("bearer ", "");
				if (token === "testPAT1") {
					const err = new Error("Bad credentials");
					// simulate axios error shape
					err.response = { data: { message: "Bad credentials" } };
					throw err;
				}
				return { data: successData };
			},
			dateDiff: () => 0,
			logger: { error: () => {} },
		}));

		const mod = await import("../../stats/api/status/pat-info.js");
		const patInfo = mod.default;
		const { req, res } = faker({}, {});
		await patInfo(req, res);

		const sent = JSON.parse(res.send.mock.calls[0][0]);
		expect(sent.expiredPATs).toEqual(["PAT_1"]);
	});

	it("should throw an error if something goes wrong", async () => {
		vi.doMock("../../stats/src/common/utils.ts", () => ({
			request: async () => {
				throw new Error("Network Error");
			},
			dateDiff: () => 0,
			logger: { error: () => {} },
		}));

		const mod = await import("../../stats/api/status/pat-info.js");
		const patInfo = mod.default;
		const { req, res } = faker({}, {});
		await patInfo(req, res);

		expect(res.setHeader).toHaveBeenCalledWith(
			"Content-Type",
			"application/json",
		);
		expect(res.send).toHaveBeenCalledWith(
			"Something went wrong: Network Error",
		);
	});

	it("should have proper cache when no error is thrown", async () => {
		vi.doMock("../../stats/src/common/utils.ts", () => ({
			request: async () => ({ data: successData }),
			dateDiff: () => 0,
			logger: { error: () => {} },
		}));

		const mod = await import("../../stats/api/status/pat-info.js");
		const patInfo = mod.default;
		const { RATE_LIMIT_SECONDS } = mod;
		const { req, res } = faker({}, {});
		await patInfo(req, res);

		expect(res.setHeader.mock.calls).toEqual([
			["Content-Type", "application/json"],
			["Cache-Control", `max-age=0, s-maxage=${RATE_LIMIT_SECONDS}`],
		]);
	});

	it("should have proper cache when error is thrown", async () => {
		vi.doMock("../../stats/src/common/utils.ts", () => ({
			request: async () => {
				const err = new Error("Network Error");
				throw err;
			},
			dateDiff: () => 0,
			logger: { error: () => {} },
		}));

		const mod = await import("../../stats/api/status/pat-info.js");
		const patInfo = mod.default;
		const { req, res } = faker({}, {});
		await patInfo(req, res);

		expect(res.setHeader.mock.calls).toEqual([
			["Content-Type", "application/json"],
			["Cache-Control", "no-store"],
		]);
	});
});
