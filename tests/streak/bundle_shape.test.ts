import path from "node:path";
import { pathToFileURL } from "node:url";
import { expect, it } from "vitest";

it("streak/dist bundle exports expected public API", async () => {
	// Resolved to a path at runtime rather than handed to `import` as a literal:
	// the bundle is a build artifact, and a literal specifier would make `tsc
	// --noEmit` (which runs before any build in the lint job) fail to resolve it
	// in a fresh checkout. `import.meta.url` is an http: URL under vitest, so
	// the file URL is built from `process.cwd()` like `renderer_imports` does.
	const bundleUrl = pathToFileURL(
		path.resolve(process.cwd(), "streak/dist/index.js"),
	).href;
	const mod = await import(/* @vite-ignore */ bundleUrl);
	const expected = [
		"generateOutput",
		"renderForUser",
		"getCache",
		"generateCard",
		"fetchContributions",
		"getContributionStats",
		"getWeeklyContributionStats",
	];
	const modRecord = mod as unknown as Record<string, unknown>;
	for (const k of expected) {
		expect(modRecord[k]).not.toBeUndefined();
	}
});
