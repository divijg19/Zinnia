import path from "node:path";
import { writeTrophyCacheWithMeta } from "../api/_utils.ts";

// Ensure CACHE_DIR is set so api/cache writes to tmp/cache
process.env.CACHE_DIR = path.resolve("./tmp/cache");

async function seed() {
	const upstream = new URL("https://github-profile-trophy.vercel.app/");
	upstream.searchParams.set("username", "divijg19");
	upstream.searchParams.set("theme", "watchdog");
	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60"><rect width="100%" height="100%" fill="#010101"/></svg>`;
	const etag = "";
	await writeTrophyCacheWithMeta(upstream.toString(), body, etag, 86400);
	console.log("Wrote cached trophy entry for", upstream.toString());
}

seed().catch((e) => {
	console.error(e);
	process.exit(1);
});
