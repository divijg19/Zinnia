import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
	test: {
		// Use a relative setup path resolved from the leetcode/ package root
		setupFiles: ["test/vitest.setup.ts"],
		testTimeout: 15000,
		// Only run our own tests; exclude upstream package tests
		include: ["test/**/*.{test,spec}.{ts,tsx,js,jsx}"],
		exclude: [
			"packages/core/src/_test/**",
			"packages/**/src/**/demo/**",
		],
		coverage: {
			provider: "v8",
			include: ["packages/*/src/**/*.ts"],
			exclude: [
				"packages/**/src/**/demo/**",
				"**/*.html",
			],
		},
	},
	resolve: {
		alias: [
			{
				find: /^nano-font\/fonts\/.*/,
				replacement: resolve(__dirname, "test/__mocks__/font-stub.ts"),
			},
		],
	},
});
