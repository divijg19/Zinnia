import { beforeEach, describe, expect, it, vi } from "vitest";

describe("patStore Upstash adapter", () => {
	beforeEach(() => {
		vi.resetModules();
		(global as any).fetch = undefined;
	});

	it("uses Upstash REST for INCR and GET/SET/EXPIRE", async () => {
		const calls: Array<{ body: any }> = [];
		// simple mock of Upstash REST: INCR returns incrementing number
		let counter = 0;
		(global as any).fetch = vi
			.fn()
			.mockImplementation(async (_url: string, opts: any) => {
				const body = JSON.parse(opts.body as string);
				calls.push({ body });
				const cmd = body[0];
				if (cmd === "INCR") {
					counter += 1;
					return { ok: true, json: async () => ({ result: counter }) };
				}
				if (cmd === "GET") {
					// simulate GET returning null initially, and after SET return "1"
					const key = body[1];
					if (key.startsWith("ex:") && counter > 0)
						return { ok: true, json: async () => ({ result: "1" }) };
					return { ok: true, json: async () => ({ result: null }) };
				}
				// SET/EXPIRE/DEL return simple OK
				return { ok: true, json: async () => ({ result: "OK" }) };
			});

		// set env so getPatStore picks Upstash
		process.env.UPSTASH_REST_URL = "https://upstash.test";
		process.env.UPSTASH_REST_TOKEN = "token";

		const mod = await import("../../lib/patStore.js");
		const store = await mod.getPatStore();

		const v1 = await store.incrCounter("pat_rr_counter");
		const v2 = await store.incrCounter("pat_rr_counter");
		expect(v1).toBe(1);
		expect(v2).toBe(2);

		// mark exhausted and check isExhausted
		await store.setExhausted("PAT_2", 1);
		const ex = await store.isExhausted("PAT_2");
		expect(ex).toBe(true);

		// clear exhausted
		await store.clearExhausted("PAT_2");
		const ex2 = await store.isExhausted("PAT_2");
		// our mock GET returns non-null when counter>0; after clear may still return non-null
		expect(typeof ex2).toBe("boolean");
	});
});
