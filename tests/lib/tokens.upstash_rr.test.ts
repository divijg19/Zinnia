import { beforeEach, describe, expect, it, vi } from "vitest";

describe("getGithubPATAsync round-robin with Upstash", () => {
	beforeEach(() => {
		vi.resetModules();
		(global as any).fetch = undefined;
		// ensure clean env
		delete process.env.UPSTASH_REST_URL;
		delete process.env.UPSTASH_REST_TOKEN;
		delete process.env.ZINNIA_REST_URL;
		delete process.env.ZINNIA_REST_TOKEN;
	});

	it("rotates across PAT_1..PAT_5 and skips exhausted keys", async () => {
		// set the PATs
		process.env.PAT_1 = "t1";
		process.env.PAT_2 = "t2";
		process.env.PAT_3 = "t3";
		process.env.PAT_4 = "t4";
		process.env.PAT_5 = "t5";

		const calls: Array<{ body: any; url: string }> = [];
		let incrCounter = 0;

		// Mock Upstash REST API: INCR returns incrementing numbers (1,2,3...),
		// GET returns non-null for the exhausted key ex:PAT_3, causing it to be skipped.
		(global as any).fetch = vi
			.fn()
			.mockImplementation(async (url: string, opts: any) => {
				const body = JSON.parse(opts.body as string);
				calls.push({ body, url });
				const cmd = body[0];
				if (cmd === "INCR") {
					incrCounter += 1;
					return { ok: true, json: async () => ({ result: incrCounter }) };
				}
				if (cmd === "GET") {
					const key = body[1];
					if (typeof key === "string" && key === "ex:PAT_3") {
						return { ok: true, json: async () => ({ result: "1" }) };
					}
					return { ok: true, json: async () => ({ result: null }) };
				}
				// default for SET/EXPIRE/DEL
				return { ok: true, json: async () => ({ result: "OK" }) };
			});

		// enable Upstash path
		process.env.UPSTASH_REST_URL = "https://upstash.test";
		process.env.UPSTASH_REST_TOKEN = "token";

		const { getGithubPATAsync } = await import("../../lib/tokens.js");

		// Call several times and record tokens
		const seen: string[] = [];
		for (let i = 0; i < 5; i++) {
			const t = await getGithubPATAsync();
			seen.push(t ?? "");
		}

		// With INCR sequence 1..5 and keys PAT_1..PAT_5 and PAT_3 exhausted,
		// the expected picked keys (by index) are:
		// n=1 -> start=1 -> try PAT_2 -> ok => t2
		// n=2 -> start=2 -> try PAT_3 -> exhausted -> next PAT_4 => t4
		// n=3 -> start=3 -> try PAT_4 => t4 (but previous call may have returned same; still valid)
		// n=4 -> start=4 -> try PAT_5 => t5
		// n=5 -> start=0 -> try PAT_1 => t1

		// We assert the first, second, fourth and fifth picks specifically.
		expect(seen[0]).toBe("t2");
		expect(seen[1]).toBe("t4");
		expect(seen[3]).toBe("t5");
		expect(seen[4]).toBe("t1");
	});
});
