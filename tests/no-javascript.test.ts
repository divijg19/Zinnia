import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

/**
 * The repository stays TypeScript.
 *
 * The demo used to be the last JavaScript: a browser app loaded as native
 * ESM. It is TypeScript now, and the bundle the page loads is a build
 * artifact. This guards the end state, so the next JavaScript file has to be
 * a deliberate decision rather than an accident.
 */
describe("the repository tracks no JavaScript", () => {
	it("has no tracked .js, .mjs or .cjs file", () => {
		const tracked = execFileSync(
			"git",
			["ls-files", "*.js", "*.mjs", "*.cjs"],
			{ encoding: "utf8" },
		).trim();
		expect(tracked).toBe("");
	});
});
