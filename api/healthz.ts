// Machine readiness probe: JSON, `X-Ready`, and nothing else.
//
// Named `healthz` rather than `__health` on purpose. Vercel does not turn files
// in `api/` whose names start with an underscore into functions (they are
// treated as shared code), so `api/__health.ts` deployed successfully while
// `/api/__health` returned 404 for every caller - the unit test exercised the
// handler directly and never noticed. `vercel.json` rewrites the old path here,
// so the documented URL keeps working.
import type { RequestLike, ResponseLike } from "../streak/src/server_types";

export default function handler(_req: RequestLike, res: ResponseLike) {
	try {
		res.setHeader("Content-Type", "application/json; charset=utf-8");
	} catch {}
	try {
		res.setHeader("X-Ready", "1");
	} catch {}
	// A readiness probe must reflect live state, so it is never cached.
	try {
		res.setHeader("Cache-Control", "no-store");
	} catch {}
	try {
		res.status(200);
	} catch {}
	return res.send(JSON.stringify({ ok: true }));
}
