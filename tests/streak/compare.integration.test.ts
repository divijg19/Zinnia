import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import { compareCases } from "../../streak/src/compare.ts";

describe("compareCases integration (injected generateOutput)", () => {
	it("handles string body, no php baseline", async () => {
		const { success, details } = await compareCases({
			outdir: "./streak/scripts/php-outputs-does-not-exist",
			resultsDir: "./streak/scripts/compare-results-test",
			cases: [{ name: "string-body", params: {} }],
			generateOutput: async () => ({ body: "<svg>ok</svg>" }),
		});
		expect(details[0].name).toBe("string-body");
		expect(success).toBe(true);
	});

	it("handles Readable stream body", async () => {
		const { success, details } = await compareCases({
			resultsDir: "./streak/scripts/compare-results-test",
			cases: [{ name: "stream-body", params: {} }],
			generateOutput: async () => ({
				body: Readable.from([Buffer.from("a"), Buffer.from("b")]),
			}),
		});
		expect(details[0].name).toBe("stream-body");
		expect(success).toBe(true);
	});

	it("handles async-generator Buffer body", async () => {
		async function* gen() {
			yield Buffer.from("x");
			yield Buffer.from("y");
		}
		const { success, details } = await compareCases({
			resultsDir: "./streak/scripts/compare-results-test",
			cases: [{ name: "async-gen-body", params: {} }],
			generateOutput: async () => ({ body: gen() }),
		});
		expect(details[0].name).toBe("async-gen-body");
		expect(success).toBe(true);
	});
});
