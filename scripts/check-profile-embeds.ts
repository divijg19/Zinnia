#!/usr/bin/env bun
/**
 * Check the embed manifest against the GitHub profile README.
 *
 * The manifest (`config/embeds.json`) is what the warmer refreshes. The
 * README of the profile repository is what GitHub actually renders. If the
 * two drift apart, a card that is embedded is no longer warmed - it silently
 * falls back to the cold path, and a cold path that runs past ten seconds is
 * a broken image rather than a slow one.
 *
 * Identities come from `lib/card-identity.ts`, the same canonicalization the
 * render cache uses, so `?user=` and `?username=` are one card here as they
 * are at the origin. A rename in the README must not read as unwarmed drift.
 *
 * This compares the two sets of URLs:
 * - a card in the README but not in the manifest would never be refreshed;
 * - a card in the manifest but not in the README is refreshed for nothing.
 *
 * Both are failures: the first loses a card, the second means the manifest
 * no longer describes what is embedded.
 *
 * Usage:
 *   bun scripts/check-profile-embeds.ts [--profile OWNER/REPO] [--ref REF]
 *                                      [--config FILE]
 *
 *   --profile profile repository that holds the README (default divijg19/divijg19)
 *   --ref     branch of that repository (default main)
 *   --config  manifest path (default config/embeds.json)
 */
import { embedIdentity } from "../lib/card-identity.ts";
import { loadManifest } from "./lib/embed-contract.ts";

const args = process.argv.slice(2);
function flag(name: string, fallback: string): string {
	const index = args.indexOf(name);
	return index >= 0 && index + 1 < args.length
		? (args[index + 1] ?? fallback)
		: fallback;
}

const configFile = flag("--config", "config/embeds.json");
const profile = flag("--profile", "divijg19/divijg19");
const ref = flag("--ref", "main");

const manifest = await loadManifest(configFile);
const origin = new URL(manifest.baseUrl);

/**
 * Every image URL in the README.
 *
 * Both spellings count: an HTML `<img src="...">` and a markdown
 * `![alt](...)`. A URL inside an HTML comment still counts - the cards that
 * are ready but not enabled yet are part of the manifest, and the day they
 * are enabled the manifest is already right.
 */
function readmeUrls(markdown: string): string[] {
	const urls: string[] = [];
	for (const match of markdown.matchAll(/src=["']([^"']+)["']/g)) {
		if (match[1]) urls.push(match[1]);
	}
	for (const match of markdown.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) {
		if (match[1]) urls.push(match[1]);
	}
	return urls;
}

const rawUrl = `https://raw.githubusercontent.com/${profile}/${ref}/README.md`;
const response = await fetch(rawUrl);
if (!response.ok) {
	console.error(`FAIL: could not read ${rawUrl} (HTTP ${response.status})`);
	process.exit(1);
}
const markdown = await response.text();

const inReadme = new Map<string, string>();
for (const url of readmeUrls(markdown)) {
	const id = embedIdentity(url, undefined, origin.origin);
	if (id) inReadme.set(id, url);
}

const inManifest = new Map<string, string>();
for (const embed of manifest.embeds) {
	const id = embedIdentity(embed.path, manifest.baseUrl, origin.origin);
	if (id) inManifest.set(id, embed.path);
}

const missing = [...inManifest.keys()].filter((id) => !inReadme.has(id));
const extra = [...inReadme.keys()].filter((id) => !inManifest.has(id));

console.log(`profile: ${rawUrl}`);
console.log(`manifest: ${configFile} (${inManifest.size} cards)`);
console.log(`profile README: ${inReadme.size} cards`);

for (const id of extra) {
	console.log(`FAIL: embedded but not in the manifest: ${id}`);
	console.log(`      ${inReadme.get(id)}`);
	console.log(
		"      this card is never warmed, so it falls back to the cold path",
	);
}
for (const id of missing) {
	console.log(`FAIL: in the manifest but not embedded: ${id}`);
	console.log(`      ${inManifest.get(id)}`);
	console.log("      the warmer refreshes a card nobody renders");
}

if (extra.length > 0 || missing.length > 0) {
	console.log(
		`\nprofile embeds FAILED: ${extra.length} unwarmed, ${missing.length} unused`,
	);
	process.exit(1);
}
console.log(
	`\nprofile embeds OK: ${inManifest.size} cards match the profile README`,
);
