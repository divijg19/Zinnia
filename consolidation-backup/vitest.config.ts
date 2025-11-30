import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname);

const setupFile = "leetcode/test/vitest.setup.ts";
const rootSetup = "tests/vitest.setup.ts";
const includeGlobs = [
    "tests/**/*.{test,spec}.{ts,tsx,js,jsx}",
    "leetcode/test/**/*.{test,spec}.{ts,tsx,js,jsx}",
];

export default defineConfig({
    resolve: {},
    test: {
        testTimeout: 60000,
        setupFiles: [setupFile, rootSetup],
        include: includeGlobs,
        coverage: {
            provider: "v8",
            include: [
                path.join(repoRoot, "leetcode/packages/*/src"),
                path.join(repoRoot, "packages/*/src"),
            ],
        },
        globals: true,
        environment: "jsdom",
    },
});
