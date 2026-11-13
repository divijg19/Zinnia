#!/usr/bin/env bun
/**
 * Embed contract smoke check: every card endpoint must answer always-200 +
 * SVG content-type + a structurally renderable <svg> body + ETag, within a
 * time budget. On failure, endpoints with ?debug=1 diagnostics print a
 * diagnosis.
 *
 * The card URLs come from `config/embeds.json` - the same manifest the
 * warmer reads - so this checks the cards that are actually embedded in the
 * GitHub profile README rather than a hand-kept stand-in.
 *
 * Usage:
 *   bun scripts/smoke-embeds.ts [--base URL] [--user NAME]
 *                               [--leetcode-user NAME] [--cold] [--budget MS]
 *                               [--config FILE]
 *
 *   --base         origin to test (default: the manifest's baseUrl)
 *   --user         GitHub username to render (default: the manifest's)
 *   --leetcode-user LeetCode username, when it differs from --user
 *   --cold         append a unique `_cb` param so the CDN misses. The param is
 *                  underscore-prefixed, which the render cache deliberately
 *                  ignores, so this measures the real cache path rather than
 *                  evicting the card.
 *   --budget       per-endpoint time budget in ms (default 5000)
 *   --config       manifest path (default config/embeds.json)
 *   --retries      attempts per endpoint before it is called unhealthy (default 1)
 *
 * Why the budget matters: GitHub Camo gives up fetching an origin image after
 * 10s and renders nothing at all, so an endpoint that answers in 9s is a
 * broken embed in a README even though the status is 200. 5000ms leaves
 * headroom for Camo's own fetch and for a GitHub API hiccup.
 *
 * Examples:
 *   bun scripts/smoke-embeds.ts --base http://localhost:3000 --user divijg19
 *   bun scripts/smoke-embeds.ts --base https://zinnia-rho.vercel.app --cold
 */
import {
	cacheBustParam,
	fetchCard,
	joinUrl,
	loadManifest,
	withUser,
} from "./lib/embed-contract.ts";

const args = process.argv.slice(2);
function flag(name: string, fallback: string): string {
	const index = args.indexOf(name);
	return index >= 0 && index + 1 < args.length
		? (args[index + 1] ?? fallback)
		: fallback;
}
function has(name: string): boolean {
	return args.includes(name);
}

const configFile = flag("--config", "config/embeds.json");
const BUDGET_MS = Number(flag("--budget", "5000")) || 5000;
const RETRIES = Math.max(0, Number(flag("--retries", "1")) || 0);
const COLD = has("--cold");
const user = args.includes("--user") ? flag("--user", "") : undefined;
const leetcodeUser = args.includes("--leetcode-user")
	? flag("--leetcode-user", "")
	: undefined;

const manifest = await loadManifest(configFile);
const BASE = flag("--base", manifest.baseUrl);
let embeds = withUser(manifest.embeds, user);
if (leetcodeUser) {
	embeds = embeds.map((embed) =>
		embed.name === "leetcode"
			? (withUser([embed], leetcodeUser)[0] ?? embed)
			: embed,
	);
}

/**
 * Ask the card route for its JSON diagnosis.
 *
 * The debug payload names the stage that failed (validation, fetch, render),
 * whether a PAT is present, and the timings - which is the difference
 * between "the card is broken" and "the card is slow".
 */
async function diagnose(path: string) {
	try {
		const separator = path.includes("?") ? "&" : "?";
		const res = await fetch(`${BASE}${path}${separator}debug=1`);
		const text = await res.text();
		let payload: Record<string, unknown>;
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
		const code = String(payload.code ?? "");
		if (code === "STATS_RATE_LIMIT" || code === "TOP_LANGS_RATE_LIMIT") {
			console.log(
				"    hint: no PAT configured server-side; set PAT_1 (or GITHUB_TOKEN).",
			);
		} else if (code === "USER_NOT_FOUND") {
			console.log("    hint: the username does not resolve to a GitHub user.");
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
const rows: {
	endpoint: string;
	status: number;
	ms: number;
	bytes: number;
	cache: string;
}[] = [];

for (const embed of embeds) {
	const url = joinUrl(BASE, embed.path);
	// `_cb` is stripped from the render-cache key, so `--cold` forces a CDN miss
	// without disturbing the cache it is measuring.
	const requestUrl = COLD
		? `${url}${url.includes("?") ? "&" : "?"}${cacheBustParam()}`
		: url;
	const result = await fetchCard(requestUrl, BUDGET_MS, RETRIES);

	rows.push({
		endpoint: embed.name,
		status: result.status,
		ms: result.ms,
		bytes: result.bytes,
		cache: result.cacheStatus,
	});
	if (result.problems.length === 0) {
		console.log(
			`OK:   ${embed.name} (${result.ms}ms, ${result.bytes}b, X-Cache-Status=${result.cacheStatus})`,
		);
	} else {
		failures += 1;
		console.log(`FAIL: ${embed.name} (${requestUrl})`);
		for (const p of result.problems) console.log(`    - ${p}`);
		await diagnose(embed.path);
	}
}

console.log("");
console.table(rows);

if (failures > 0) {
	console.log(
		`\nembed smoke FAILED: ${failures}/${embeds.length} endpoints unhealthy (budget ${BUDGET_MS}ms${COLD ? ", cold" : ""})`,
	);
	process.exit(1);
}
console.log(
	`\nembed smoke passed: ${embeds.length}/${embeds.length} endpoints healthy (budget ${BUDGET_MS}ms${COLD ? ", cold" : ""})`,
);
