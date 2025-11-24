/**
 * Simple diagnostics endpoint returning discovered PAT keys and exhausted status
 */
import { listPatStatus } from "../../../lib/tokens.js";

export default async (_req, res) => {
	res.setHeader("Content-Type", "application/json");
	try {
		const status = listPatStatus();
		res.setHeader("Cache-Control", "no-store");
		res.send(JSON.stringify({ ok: true, tokens: status }, null, 2));
	} catch (err) {
		res.setHeader("Cache-Control", "no-store");
		res.statusCode = 500;
		res.send(JSON.stringify({ ok: false, error: String(err) }));
	}
};
