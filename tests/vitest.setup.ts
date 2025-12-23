import fs from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeAll } from "vitest";

// Make test-mode detection deterministic for loader and helpers
process.env.VITEST = "1";

// Register snapshot serializer for SVG normalization
try {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { expect } = require("vitest");
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const serializer = require("./snapshot-serializers/svg-serializer").default;
	if (expect && serializer && typeof expect.addSnapshotSerializer === "function") {
		expect.addSnapshotSerializer(serializer);
	}
} catch {
	// ignore; setup runs in various environments
}

// Ensure any test-injected renderer fallback is cleared before tests run
try {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	delete (globalThis as any).__STREAK_TEST_RENDERER;
} catch { }

// Use a per-worker cache directory to avoid cross-worker races. Tests run in
// multiple workers and all share the repository `cache/` location by default.
const workerTrophy = path.join(process.cwd(), "cache", `trophy-${process.pid}`);

beforeAll(async () => {
	try {
		// Point the runtime to a worker-scoped cache dir
		process.env.TROPHY_CACHE_DIR = workerTrophy;
		await fs.rm(workerTrophy, { recursive: true, force: true });
	} catch (_e) {
		// ignore
	}
});

afterAll(async () => {
	try {
		await fs.rm(workerTrophy, { recursive: true, force: true });
	} catch (_e) {
		// ignore
	}
});
