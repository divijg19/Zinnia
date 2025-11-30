import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
	test: {
		// Package-local minimal overrides: keep package setup and test include/excludes
		setupFiles: ["test/vitest.setup.ts"],
		testTimeout: 15000,
		include: ["test/**/*.{test,spec}.{ts,tsx,js,jsx}"],
		exclude: ["packages/core/src/_test/**", "packages/**/src/**/demo/**"],
		coverage: {
			provider: "v8",
			include: ["packages/*/src/**/*.ts"],
			exclude: [
				"packages/**/src/**/demo/**",
				"**/*.html",
				"packages/core/src/constants.ts",
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
