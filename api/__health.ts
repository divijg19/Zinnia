// Simple health endpoint for readiness checks used by E2E/CI.
import type { RequestLike, ResponseLike } from "../streak/src/server_types";

export default function handler(_req: RequestLike, res: ResponseLike) {
	try {
		res.setHeader("Content-Type", "application/json; charset=utf-8");
	} catch {}
	try {
		res.setHeader("X-Ready", "1");
	} catch {}
	try {
		res.status(200);
	} catch {}
	return res.send(JSON.stringify({ ok: true }));
}

export { handler as default };
