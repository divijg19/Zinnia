import { beforeEach, describe, expect, it, vi } from "vitest";

describe("service-aware PAT helpers", () => {
	beforeEach(() => {
		vi.resetModules();
		// clear env and set canonical PATs
		process.env = {} as unknown as NodeJS.ProcessEnv;
		process.env.PAT_1 = "p1";
		process.env.PAT_2 = "p2";
		process.env.PAT_3 = "p3";
		process.env.PAT_4 = "p4";
		process.env.PAT_5 = "p5";
	});

	it("getGithubPATForService returns preferred token when present", async () => {
		const tokens = await import("../../lib/tokens.js");
		const t = tokens.getGithubPATForService("trophy");
		expect(t).toBe("p3");
	});

	it("getGithubPATForService falls back when preferred exhausted", async () => {
		const tokens = await import("../../lib/tokens.js");
		// mark PAT_1 exhausted to force fallback
		tokens.markPatExhausted("PAT_1");
		const t = tokens.getGithubPATForService("top-langs");
		// should not return PAT_1 value; should return one of remaining tokens
		expect(["p2", "p3", "p4", "p5"]).toContain(t);
	});

	it("getGithubPATWithKeyForServiceAsync returns key+token for preferred", async () => {
		const tokens = await import("../../lib/tokens.js");
		const binding = await tokens.getGithubPATWithKeyForServiceAsync("streak");
		expect(binding).toBeDefined();
		expect(binding?.key).toBe("PAT_4");
		expect(binding?.token).toBe("p4");
	});

	it("getGithubPATWithKeyForServiceAsync falls back to global when preferred remote-exhausted", async () => {
		// simulate store marking preferred as exhausted by using markPatExhausted
		const tokens = await import("../../lib/tokens.js");
		await tokens.markPatExhaustedAsync("PAT_2");
		const binding = await tokens.getGithubPATWithKeyForServiceAsync("leetcode");
		// binding should not be PAT_2
		expect(binding).toBeDefined();
		expect(binding?.key).not.toBe("PAT_2");
	});
});
