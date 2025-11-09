import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createStatsHandler } from "./_stats-wrapper.js";

export default createStatsHandler({
	importPath: "../stats/api/top-langs.js",
	patErrorMessage: "Set PAT_1 in Vercel for top-langs",
	usernameErrorCode: "UNKNOWN",
	internalErrorMessage: "top-langs: internal error",
	internalErrorCode: "TOP_LANGS_INTERNAL",
	cacheEnvVars: ["TOP_LANGS_CACHE_SECONDS", "CACHE_SECONDS"],
	defaultCacheSeconds: 86400,
	defaultUrl: "/api/top-langs",
});
