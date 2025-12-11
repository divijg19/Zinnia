import { handleWeb as trophyHandle } from "../trophy/api/index.ts";

async function run() {
	console.log("Running trophy smoke test");
	const url = "https://localhost/api/trophy?username=divijg19&theme=watchdog";
	const req1 = new Request(url, {
		method: "GET",
		headers: { "x-forwarded-proto": "https", host: "localhost" },
	});
	const res1 = await trophyHandle(req1 as Request);
	console.log("First request status:", res1.status);
	for (const [k, v] of res1.headers.entries()) {
		if (
			k.toLowerCase().startsWith("x-") ||
			k.toLowerCase() === "etag" ||
			k.toLowerCase().includes("cache")
		)
			console.log(`${k}: ${v}`);
	}
	const body1 = await res1.text();
	console.log("Body length:", body1.length);
	console.log("Body preview:\n", body1.slice(0, 800));

	const etag = res1.headers.get("etag");
	if (etag) {
		console.log("\nRe-requesting with If-None-Match:", etag);
		const req2 = new Request(url, {
			method: "GET",
			headers: {
				"If-None-Match": etag,
				"x-forwarded-proto": "https",
				host: "localhost",
			},
		});
		const res2 = await trophyHandle(req2 as Request);
		console.log("Second request status:", res2.status);
		for (const [k, v] of res2.headers.entries()) {
			if (
				k.toLowerCase().startsWith("x-") ||
				k.toLowerCase() === "etag" ||
				k.toLowerCase().includes("cache")
			)
				console.log(`${k}: ${v}`);
		}
		const body2 = await res2.text();
		console.log("Body length:", body2.length);
		console.log("Body preview:\n", body2.slice(0, 400));
	} else {
		console.log("No ETag returned, skipping If-None-Match test");
	}
}

run().catch((e) => {
	console.error("Smoke test failed:", e);
	process.exit(1);
});
