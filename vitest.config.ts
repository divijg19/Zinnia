import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname);

// Accept both repository-root-relative and package-CWD-relative runs by
// resolving absolute paths for the setup file and using globs that match
// either layout (helps when running `cd leetcode && vitest`).
const setupFile = path.join(repoRoot, "leetcode/test/vitest.setup.ts");
// A repo-wide include pattern is the most robust: it finds any *.test.* or *.spec.* file
// regardless of whether Vitest is executed from the repo root or a package subfolder.
const includeGlobs = [path.join(repoRoot, "**/*.{test,spec}.{ts,tsx,js,jsx}")];

export default defineConfig({
	test: {
		// Leverage the existing vitest setup file under leetcode so mocks load before tests
		setupFiles: [setupFile],
		include: includeGlobs,
		coverage: {
			provider: "v8",
			include: [
				path.join(repoRoot, "leetcode/packages/*/src"),
				path.join(repoRoot, "packages/*/src"),
			],
		},
	},
});
