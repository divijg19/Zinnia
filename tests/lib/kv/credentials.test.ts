import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { resolveKvCredentials } from "../../../lib/kv/credentials";

/**
 * One resolution for every KV consumer.
 *
 * The render cache, the PAT store and the streak contribution cache all talk
 * to Upstash. When they each resolved the endpoint themselves, a deployment
 * configured with a name only one of them knew put its render cache in one
 * bucket and its contribution cache in another - or nowhere.
 */

/** The env var names that point at a KV endpoint. */
const KV_URL_NAMES = [
	"UPSTASH_KV_REST_API_URL",
	"UPSTASH_REST_URL",
	"UPSTASH_URL",
	"UPSTASH_KV_URL",
	"UPSTASH_REDIS_URL",
	"ZINNIA_REST_URL",
	"ZINNIA_KV_REST_API_URL",
	"ZINNIA_KV_URL",
];

const TOKEN_NAMES = [
	"UPSTASH_KV_REST_API_TOKEN",
	"UPSTASH_KV_REST_API_READ_ONLY_TOKEN",
	"UPSTASH_REST_TOKEN",
	"UPSTASH_TOKEN",
	"ZINNIA_REST_TOKEN",
	"ZINNIA_KV_REST_API_TOKEN",
];

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..", "..");

function sourceFiles(dir: string): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) {
			if (entry === "node_modules" || entry === "dist") continue;
			out.push(...sourceFiles(full));
		} else if (full.endsWith(".ts")) {
			out.push(full);
		}
	}
	return out;
}

describe("lib/kv/credentials", () => {
	const saved = { ...process.env };

	afterEach(() => {
		for (const key of Object.keys(process.env)) {
			if (!(key in saved)) delete process.env[key];
		}
		Object.assign(process.env, saved);
	});

	it("finds the endpoint under every supported name", () => {
		for (const name of KV_URL_NAMES) {
			for (const key of Object.keys(process.env)) {
				if (
					key.includes("UPSTASH") ||
					key.includes("ZINNIA") ||
					key === "REDIS_URL"
				) {
					delete process.env[key];
				}
			}
			process.env[name] = "https://kv.test";
			process.env.UPSTASH_TOKEN = "tok";
			expect(resolveKvCredentials()?.url, name).toBe("https://kv.test");
		}
	});

	it("finds the token under every supported name", () => {
		for (const name of TOKEN_NAMES) {
			for (const key of Object.keys(process.env)) {
				if (
					key.includes("UPSTASH") ||
					key.includes("ZINNIA") ||
					key === "REDIS_URL"
				) {
					delete process.env[key];
				}
			}
			process.env.UPSTASH_REST_URL = "https://kv.test";
			process.env[name] = "tok";
			expect(resolveKvCredentials()?.token, name).toBe("tok");
		}
	});

	it("is the only place that names the KV environment variables", () => {
		// The resolver is the single source of truth, so no other source file
		// may name the endpoint itself - that is how the streak contribution
		// cache ended up with its own, shorter, ladder.
		const offenders: string[] = [];
		for (const dir of ["lib", "api", "streak/src", "stats/src", "trophy/src"]) {
			for (const file of sourceFiles(join(root, dir))) {
				if (file.endsWith("lib/kv/credentials.ts")) continue;
				// Comments may name the variables - the PAT store documents
				// them - but only code can resolve them.
				const source = readFileSync(file, "utf8")
					.replace(/\/\*[\s\S]*?\*\//g, "")
					.replace(/\/\/[^\n]*/g, "");
				for (const name of [...KV_URL_NAMES, ...TOKEN_NAMES]) {
					if (source.includes(name)) offenders.push(`${file}: ${name}`);
				}
			}
		}
		expect(offenders).toEqual([]);
	});
});
