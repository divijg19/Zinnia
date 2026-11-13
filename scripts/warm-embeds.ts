#!/usr/bin/env bun
/**
 * Warm the cards that the GitHub profile README embeds.
 *
 * Why this exists: a card that is not cached is rendered on the spot, which
 * costs a GitHub API round trip. Measured cold renders run 1.8-7.7s, and
 * GitHub Camo fetches an embedded image with a ten second socket timeout and
 * does not cache a failure - so a slow cold render is not a slow card, it is
 * a broken image on the profile page.
 *
 * The render cache keeps a card for a day and can serve the previous render
 * for another day, so a card that is refreshed every few hours never
 * expires. That is what this script does: it re-requests each card with a
 * cache-busting parameter, which forces the origin to render it again while
 * leaving the cached entry itself in place.
 *
 * The URLs come from `config/embeds.json`, which is the same file the smoke
 * check reads, so the two can never drift apart.
 *
 * Usage:
 *   bun scripts/warm-embeds.ts [--base URL] [--budget MS] [--config FILE]
 *                              [--user NAME] [--retries N]
 *
 *   --base    origin to warm (default: the manifest's baseUrl)
 *   --budget  per-card time budget in ms (default 5000)
 *   --config  manifest path (default config/embeds.json)
 *   --user    warm another account instead of the manifest's username
 *   --retries attempts per card before it is called unhealthy (default 1)
 *
 * Exits non-zero when a card breaks the embed contract, so it can be used as
 * a health check as well as a warmer.
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

const configFile = flag("--config", "config/embeds.json");
const budgetMs = Number(flag("--budget", "5000")) || 5000;
const retries = Math.max(0, Number(flag("--retries", "1")) || 0);
const user = args.includes("--user") ? flag("--user", "") : undefined;

const manifest = await loadManifest(configFile);
const base = flag("--base", manifest.baseUrl);
const embeds = withUser(manifest.embeds, user);

let failures = 0;
const rows: {
	card: string;
	status: number;
	ms: number;
	bytes: number;
	cache: string;
	ok: boolean;
}[] = [];

for (const embed of embeds) {
	const separator = embed.path.includes("?") ? "&" : "?";
	const url = `${joinUrl(base, embed.path)}${separator}${cacheBustParam()}`;
	const result = await fetchCard(url, budgetMs, retries);

	if (result.problems.length === 0) {
		console.log(
			`OK:   ${embed.name} (${result.ms}ms, ${result.bytes}b, X-Cache-Status=${result.cacheStatus})`,
		);
	} else {
		failures += 1;
		console.log(`FAIL: ${embed.name} (${url})`);
		for (const problem of result.problems) console.log(`    - ${problem}`);
	}
	rows.push({
		card: embed.name,
		status: result.status,
		ms: result.ms,
		bytes: result.bytes,
		cache: result.cacheStatus,
		ok: result.problems.length === 0,
	});
}

console.log("");
console.table(rows);

if (failures > 0) {
	console.log(
		`\nwarm FAILED: ${failures}/${embeds.length} cards unhealthy against ${base} (budget ${budgetMs}ms)`,
	);
	process.exit(1);
}
console.log(
	`\nwarm passed: ${embeds.length}/${embeds.length} cards healthy against ${base} (budget ${budgetMs}ms)`,
);
