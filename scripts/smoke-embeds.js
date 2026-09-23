#!/usr/bin/env bun
// Embed contract smoke check: every card endpoint must answer
// always-200 + SVG content-type + non-empty <svg> body + ETag.
// On failure, endpoints with ?debug=1 diagnostics print a diagnosis.
//
// Usage:
//   bun scripts/smoke-embeds.js [--base URL] [--user NAME] [--leetcode-user NAME]
// Examples:
//   bun scripts/smoke-embeds.js --base http://localhost:3000 --user divijg19
//   bun scripts/smoke-embeds.js --base https://zinnia.vercel.app --user divijg19

const args = process.argv.slice(2);
function flag(name, fallback) {
	const i = args.indexOf(name);
	return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback;
}

const BASE = (flag("--base", "http://localhost:3000") || "").replace(/\/$/, "");
const USER = flag("--user", "divijg19");
const LEETCODE_USER = flag("--leetcode-user", USER);

const ENDPOINTS = [
	{
		name: "stats",
		path: `/api/stats?username=${USER}&theme=light`,
		debug: true,
	},
	{
		name: "top-langs",
		path: `/api/top-langs?username=${USER}&theme=light&layout=compact`,
		debug: true,
	},
	{ name: "streak", path: `/api/streak?username=${USER}&theme=light` },
	{ name: "trophy", path: `/api/trophy?username=${USER}&theme=light` },
	{
		name: "leetcode",
		path: `/api/leetcode?username=${LEETCODE_USER}&theme=light`,
	},
];

async function diagnose(base, path) {
	try {
		const sep = path.includes("?") ? "&" : "?";
		const res = await fetch(`${base}${path}${sep}debug=1`);
		const text = await res.text();
		let payload;
		try {
			payload = JSON.parse(text);
		} catch {
			console.log("    debug endpoint did not return JSON.");
			return;
		}
		console.log(`    diagnosis: stage=${payload.stage} ok=${payload.ok}`);
		if (payload.params)
			console.log(`    params: ${JSON.stringify(payload.params)}`);
		if (payload.validation)
			console.log(`    validation: ${JSON.stringify(payload.validation)}`);
		if (payload.error) console.log(`    error: ${payload.error}`);
		if (payload.code) console.log(`    code: ${payload.code}`);
		if (payload.timing)
			console.log(`    timing: ${JSON.stringify(payload.timing)}`);
		if (
			payload.code === "STATS_RATE_LIMIT" ||
			payload.code === "TOP_LANGS_RATE_LIMIT"
		) {
			console.log(
				"    hint: no PAT configured server-side; set PAT_1 (or GITHUB_TOKEN).",
			);
		} else if (payload.stage === "validation") {
			console.log("    hint: check the ?username=/other query params.");
		} else if (payload.stage === "error") {
			console.log(
				"    hint: upstream or renderer failed; error above is redacted server-side.",
			);
		}
	} catch (err) {
		console.log(`    debug fetch failed: ${String(err)}`);
	}
}

let failures = 0;
for (const ep of ENDPOINTS) {
	const url = `${BASE}${ep.path}`;
	const problems = [];
	let status = 0;
	try {
		const res = await fetch(url);
		status = res.status;
		const ct = res.headers.get("content-type") || "";
		const etag = res.headers.get("etag") || "";
		const body = await res.text();
		if (status !== 200) problems.push(`status ${status} (want 200)`);
		if (!ct.includes("image/svg"))
			problems.push(`content-type ${JSON.stringify(ct)}`);
		if (!body || !body.includes("<svg")) problems.push("empty/non-SVG body");
		if (!etag) problems.push("missing ETag");
	} catch (err) {
		problems.push(`fetch failed: ${String(err)}`);
	}
	if (problems.length === 0) {
		console.log(`OK:   ${ep.name} (${url})`);
	} else {
		failures += 1;
		console.log(`FAIL: ${ep.name} (${url})`);
		for (const p of problems) console.log(`    - ${p}`);
		if (ep.debug) await diagnose(BASE, ep.path);
		else
			console.log(
				"    hint: append ?debug=1 is only supported on stats/top-langs; check server logs otherwise.",
			);
	}
}

if (failures > 0) {
	console.log(
		`\nembed smoke FAILED: ${failures}/${ENDPOINTS.length} endpoints unhealthy`,
	);
	process.exit(1);
}
console.log(
	`\nembed smoke passed: ${ENDPOINTS.length}/${ENDPOINTS.length} endpoints healthy`,
);
