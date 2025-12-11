import path from "node:path";
import { readTrophyCacheWithMeta } from "../api/_utils.ts";

process.env.CACHE_DIR = path.resolve("./tmp/cache");
(async () => {
	const upstream = new URL("https://github-profile-trophy.vercel.app/");
	upstream.searchParams.set("username", "divijg19");
	upstream.searchParams.set("theme", "watchdog");
	const r = await readTrophyCacheWithMeta(upstream.toString());
	console.log(
		"readTrophyCacheWithMeta result:",
		r ? { bodyLength: r.body.length, etag: r.etag } : null,
	);
})();
