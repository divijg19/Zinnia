import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createStatsHandler } from "./_stats-wrapper.js";

export default createStatsHandler({
	importPath: "../stats/api/index.ts",
	patErrorMessage: "Set PAT_1 in Vercel for stats",
	usernameErrorCode: "UNKNOWN",
	internalErrorMessage: "stats: internal error",
	internalErrorCode: "STATS_INTERNAL",
	cacheEnvVars: ["STATS_CACHE_SECONDS", "CACHE_SECONDS"],
	defaultCacheSeconds: 86400,
	defaultUrl: "/api/stats",
});
