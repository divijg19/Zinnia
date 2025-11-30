import { beforeEach, describe, expect, it, vi } from "vitest";
import * as tokens from "../../lib/tokens.js";

describe("PAT rotation integration", () => {
	beforeEach(() => {
		vi.resetModules();
		process.env = {} as unknown as NodeJS.ProcessEnv;
		process.env.PAT_1 = "A";
		process.env.PAT_2 = "B";
		process.env.PAT_3 = "C";
		process.env.PAT_4 = "D";
		process.env.PAT_5 = "E";
	});

	it("evenly distributes selections via round-robin", () => {
		const counts: Record<string, number> = {};
		for (let i = 0; i < 100; i++) {
			const k = tokens.choosePatKey();
			counts[k as string] = (counts[k as string] || 0) + 1;
		}
		// Expect roughly even distribution across 5 tokens (100 picks)
		for (const k of ["PAT_1", "PAT_2", "PAT_3", "PAT_4", "PAT_5"]) {
			expect(counts[k]).toBeDefined();
			expect(counts[k]).toBeGreaterThanOrEqual(15);
			expect(counts[k]).toBeLessThanOrEqual(25);
		}
	});

	it("skips exhausted tokens and respects TTL unmarking", async () => {
		// mark PAT_3 exhausted for 1 second
		tokens.markPatExhausted("PAT_3", 1);

		// Immediately, repeated picks must not return PAT_3
		for (let i = 0; i < 50; i++) {
			const k = tokens.choosePatKey();
			expect(k).not.toBe("PAT_3");
		}

		// Use fake timers to advance time past TTL
		vi.useFakeTimers();
		vi.advanceTimersByTime(1500);

		// Now the token should be available again within several picks
		let saw = false;
		for (let i = 0; i < 50; i++) {
			const k = tokens.choosePatKey();
			if (k === "PAT_3") {
				saw = true;
				break;
			}
		}
		vi.useRealTimers();
		expect(saw).toBe(true);
	});

	it("getGithubPAT returns token values and rotates values too", () => {
		// call repeatedly and ensure values returned are one of the env values
		const seen = new Set<string>();
		for (let i = 0; i < 20; i++) {
			const v = tokens.getGithubPAT();
			if (v) seen.add(v);
		}
		expect(seen.size).toBeGreaterThanOrEqual(2);
	});
});
