import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendErrorSvg } from "../lib/errors.js";
import { getGithubPAT } from "../lib/tokens.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		if (!getGithubPAT()) {
			return sendErrorSvg(
				req,
				res,
				"Set PAT_1 in Vercel for top-langs",
				"STATS_RATE_LIMIT",
			);
		}

		// Import the Express-style handler and call it directly
		const { default: topLangsHandler } = (await import(
			"../stats/api/top-langs.js"
		)) as {
			default: (req: VercelRequest, res: VercelResponse) => Promise<void>;
		};

		// Call the handler directly with req/res
		return await topLangsHandler(req, res);
	} catch (_err) {
		return sendErrorSvg(
			req,
			res,
			"top-langs: internal error",
			"TOP_LANGS_INTERNAL",
		);
	}
}
