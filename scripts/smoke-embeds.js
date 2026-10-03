#!/usr/bin/env bun
// Embed contract smoke check: every card endpoint must answer always-200 +
// SVG content-type + a structurally renderable <svg> body + ETag, within a
// time budget. On failure, endpoints with ?debug=1 diagnostics print a
// diagnosis.
//
// Usage:
//   bun scripts/smoke-embeds.js [--base URL] [--user NAME] [--leetcode-user NAME]
//                               [--cold] [--budget MS]
//
//   --base     origin to test (default http://localhost:3000)
//   --user     GitHub username to render (default divijg19)
//   --cold     append a unique `_cb` param so the CDN misses. The param is
//              underscore-prefixed, which the render cache deliberately ignores,
//              so this measures the real cache path rather than evicting it.
//   --budget   per-endpoint time budget in ms (default 5000)
//
// Why the budget matters: GitHub Camo gives up fetching an origin image after
// 10s and renders nothing at all, so an endpoint that answers in 9s is a broken
// embed in a README even though the status is 200. 5000ms leaves headroom for
// Camo's own fetch and for a GitHub API hiccup.
//
// Examples:
//   bun scripts/smoke-embeds.js --base http://localhost:3000 --user divijg19
//   bun scripts/smoke-embeds.js --base https://zinnia-rho.vercel.app --cold

const args = process.argv.slice(2);
function flag(name, fallback) {
	const i = args.indexOf(name);
	return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback;
}
function has(name) {
	return args.includes(name);
}

const BASE = (flag("--base", "http://localhost:3000") || "").replace(/\/$/, "");
const USER = flag("--user", "divijg19");
const LEETCODE_USER = flag("--leetcode-user", USER);
const COLD = has("--cold");
const BUDGET_MS = Number(flag("--budget", "5000")) || 5000;

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
	{
		name: "streak",
		path: `/api/streak?username=${USER}&theme=light`,
		debug: true,
	},
	{
		name: "trophy",
		path: `/api/trophy?username=${USER}&theme=light`,
		debug: true,
	},
	{
		name: "leetcode",
		path: `/api/leetcode?username=${LEETCODE_USER}&theme=light`,
		debug: true,
	},
];

/**
 * Structural checks on the SVG body.
 *
 * A full XML parse is not available in Bun without adding a dependency, so
 * this checks what actually breaks embeds: a root `<svg>` that carries intrinsic
 * `width`/`height` (without them a browser falls back to 300x150 and the card
 * renders at the wrong size), a `viewBox`, and a closed root element.
 */
/**
 * Structural checks on the SVG body.
 *
 * A full XML parse is not available in Bun without adding a dependency, so this
 * checks what actually breaks embeds: a root `<svg>` that carries intrinsic
 * `width`/`height` (without them a browser falls back to 300x150 and the card
 * renders at the wrong size), a `viewBox`, and a closed root element.
 *
 * It also enforces two invariants a malformed or fragile stylesheet breaks, both
 * of which reached production. Every `<style>` block must have balanced braces:
 * a stray `}` once landed directly on top of a theme's `:root` rules, so the
 * parser discarded the palette and the card rendered as a white rectangle with
 * most of its content invisible - correct on the machine that built it, broken
 * on a phone. And no element may be hidden by a base `opacity: 0` that only an
 * animation reveals, which is blank wherever animations do not run.
 */
function inspectSvg(body) {
	const problems = [];
	if (!body.includes("<svg")) problems.push("empty/non-SVG body");
	if (body.includes("ZINNIA_ERR:"))
		problems.push("error card (ZINNIA_ERR marker)");
	if (body.includes("NaN")) problems.push("NaN in output");

	const root = /<svg\b([^>]*)>/.exec(body)?.[1];
	if (!root) {
		problems.push("no <svg> root element");
		return problems;
	}
	for (const attr of ["width", "height", "viewBox"]) {
		if (!new RegExp(`\\b${attr}=["']`).test(root)) {
			problems.push(`root <svg> has no ${attr}`);
		}
	}
	if (!/<\/svg>\s*(?:<!--[\s\S]*?-->\s*)?$/.test(body.trim())) {
		problems.push("root <svg> is not closed");
	}

	const blocks = styleBlocks(body);
	for (const block of blocks) {
		let depth = 0;
		let wentNegative = false;
		for (const ch of block) {
			if (ch === "{") depth += 1;
			else if (ch === "}") {
				depth -= 1;
				if (depth < 0) wentNegative = true;
			}
		}
		if (wentNegative) problems.push("unbalanced } in a <style> block");
		if (depth > 0) problems.push("unterminated rule in a <style> block");
	}
	const hidden = hiddenByAnimation(body);
	if (hidden.length) {
		problems.push(
			`${hidden.length} element(s) hidden until an animation runs (${hidden[0]})`,
		);
	}
	return problems;
}

function styleBlocks(body) {
	return [...body.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(
		(m) => m[1],
	);
}

/** Selectors whose base state is `opacity: 0`, outside any keyframes. */
function hiddenByAnimation(body) {
	const found = [];
	for (const block of styleBlocks(body)) {
		const withoutKeyframes = block.replace(
			/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\}\s*)*[^{}]*\}/g,
			"",
		);
		for (const m of withoutKeyframes.matchAll(
			/([^{}]*)\{opacity:\s*0\s*[;}]/g,
		)) {
			found.push(m[1].trim());
		}
	}
	return found;
}

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
		if (payload.cache)
			console.log(`    cache: ${JSON.stringify(payload.cache)}`);
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
		} else if (payload.code === "USER_NOT_FOUND") {
			console.log(`    hint: ${USER} does not resolve to a GitHub user.`);
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
const rows = [];

for (const ep of ENDPOINTS) {
	const url = `${BASE}${ep.path}`;
	// `_cb` is stripped from the render-cache key, so `--cold` forces a CDN miss
	// without disturbing the cache it is measuring.
	const requestUrl = COLD
		? `${url}${url.includes("?") ? "&" : "?"}_cb=${Math.random().toString(36).slice(2)}`
		: url;
	const problems = [];
	let status = 0;
	let ms = 0;
	let bytes = 0;
	let cacheStatus = "";
	try {
		const started = Date.now();
		const res = await fetch(requestUrl);
		status = res.status;
		const ct = res.headers.get("content-type") || "";
		const etag = res.headers.get("etag") || "";
		const cacheControl = res.headers.get("cache-control") || "";
		cacheStatus = res.headers.get("x-cache-status") || "-";
		const body = await res.text();
		ms = Date.now() - started;
		bytes = Buffer.byteLength(body);

		if (status !== 200) problems.push(`status ${status} (want 200)`);
		if (!ct.includes("image/svg"))
			problems.push(`content-type ${JSON.stringify(ct)}`);
		if (!etag) problems.push("missing ETag");
		const maxAge = /max-age=(\d+)/.exec(cacheControl)?.[1];
		if (maxAge === undefined || maxAge === "0") {
			problems.push(
				`uncacheable Cache-Control ${JSON.stringify(cacheControl)}`,
			);
		}
		if (ms > BUDGET_MS) {
			problems.push(`${ms}ms exceeds ${BUDGET_MS}ms budget`);
		}
		problems.push(...inspectSvg(body));
	} catch (err) {
		problems.push(`fetch failed: ${String(err)}`);
	}

	rows.push({ endpoint: ep.name, status, ms, bytes, cache: cacheStatus });
	if (problems.length === 0) {
		console.log(
			`OK:   ${ep.name} (${ms}ms, ${bytes}b, X-Cache-Status=${cacheStatus})`,
		);
	} else {
		failures += 1;
		console.log(`FAIL: ${ep.name} (${requestUrl})`);
		for (const p of problems) console.log(`    - ${p}`);
		if (ep.debug) await diagnose(BASE, ep.path);
	}
}

console.log("");
console.table(rows);

if (failures > 0) {
	console.log(
		`\nembed smoke FAILED: ${failures}/${ENDPOINTS.length} endpoints unhealthy (budget ${BUDGET_MS}ms${COLD ? ", cold" : ""})`,
	);
	process.exit(1);
}
console.log(
	`\nembed smoke passed: ${ENDPOINTS.length}/${ENDPOINTS.length} endpoints healthy (budget ${BUDGET_MS}ms${COLD ? ", cold" : ""})`,
);
