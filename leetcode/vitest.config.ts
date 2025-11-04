import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Use a relative setup path resolved from the leetcode/ package root
		setupFiles: ["test/vitest.setup.ts"],
		testTimeout: 15000,
		include: ["packages/*/src/**/*.{test,spec}.{ts,tsx,js,jsx}"],
		coverage: {
			provider: "v8",
			include: ["packages/*/src"],
		},
	},
});
