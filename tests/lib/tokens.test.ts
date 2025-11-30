import { beforeEach, describe, expect, it, vi } from "vitest";
import * as tokens from "../../lib/tokens.js";

describe("tokens distribution", () => {
	beforeEach(() => {
		vi.resetModules();
		process.env = {} as unknown as NodeJS.ProcessEnv;
		process.env.PAT_1 = "a";
		process.env.PAT_2 = "b";
		process.env.PAT_3 = "c";
	});

	it("returns one of the configured PATs", () => {
		const picked = tokens.getGithubPAT();
		expect(["a", "b", "c"]).toContain(picked as string);
	});

	it("can mark and avoid exhausted PATs", () => {
		const all = tokens.discoverPatKeys();
		expect(all).toEqual(["PAT_1", "PAT_2", "PAT_3"]);
		// mark PAT_2 as exhausted and ensure it's not chosen
		tokens.markPatExhausted("PAT_2");
		for (let i = 0; i < 10; i++) {
			const picked = tokens.choosePatKey();
			expect(picked).not.toBe("PAT_2");
		}
	});

	it("respects exhausted TTL and auto-unmarks", () => {
		vi.useFakeTimers();
		// mark PAT_2 exhausted for 1 second
		tokens.markPatExhausted("PAT_2", 1);
		// immediately, choice should never be PAT_2
		for (let i = 0; i < 10; i++) {
			const picked = tokens.choosePatKey();
			expect(picked).not.toBe("PAT_2");
		}
		// advance time beyond TTL
		vi.advanceTimersByTime(1500);
		// Now PAT_2 should be available again at least once in several picks
		let saw = false;
		for (let i = 0; i < 20; i++) {
			const picked = tokens.choosePatKey();
			if (picked === "PAT_2") {
				saw = true;
				break;
			}
		}
		vi.useRealTimers();
		expect(saw).toBe(true);
	});
});
