import streakHandler from "../api/streak.ts";

function makeReq(urlStr: string) {
	return {
		headers: { "x-forwarded-proto": "https", host: "localhost" },
		url: urlStr,
		method: "GET",
	} as any;
}

function makeRes() {
	const headers = new Map<string, string>();
	let statusCode = 200;
	return {
		setHeader(k: string, v: string) {
			headers.set(k, v);
		},
		status(code: number) {
			statusCode = code;
			return this;
		},
		send(body: string | Uint8Array) {
			return Promise.resolve({
				status: statusCode,
				headers: Object.fromEntries(headers),
				body: typeof body === "string" ? body : body.toString(),
			});
		},
	} as any;
}

async function run() {
	console.log("Running streak smoke test");
	const req = makeReq("/api/streak?user=divijg19&theme=watchdog");
	const res = makeRes();
	const out = await streakHandler(req, res);
	if (out && typeof out === "object" && "body" in out) {
		console.log("Status:", out.status);
		console.log("Headers:", out.headers);
		const body = String(out.body);
		console.log("Body length:", body.length);
		console.log("Body preview:", body.slice(0, 800));
	} else {
		console.log("Handler returned:", out);
	}
}

run().catch((e) => {
	console.error("streak smoke failed:", e);
	process.exit(1);
});
