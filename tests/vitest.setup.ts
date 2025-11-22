import fs from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeAll } from "vitest";

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
