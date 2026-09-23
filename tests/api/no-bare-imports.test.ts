import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Vercel runs compiled output as plain Node ESM, which throws
// ERR_UNSUPPORTED_DIR_IMPORT for bare relative imports (no extension).
// Bun/vite/tsc resolve them leniently, so without this guard a green CI
// can ship functions that 500 on every invocation (stats/top-langs
// incident). Type-only imports/exports are erased at compile and exempt.

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..");
const SCAN_DIRS = [
	"api",
	join("stats", "src"),
	"lib",
	join("streak", "src"),
	join("trophy", "api"),
	join("trophy", "src"),
];

const SPEC_RE =
	/(?:import|export)(?!\s+type)[^'"`]*?\bfrom\s+['"`](\.[^'"`]+)['"`]/g;
const DYNAMIC_RE = /import\(\s*['"`](\.[^'"`]+)['"`]\s*\)/g;

function tsFiles(dir: string): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) out.push(...tsFiles(full));
		else if (full.endsWith(".ts")) out.push(full);
	}
	return out;
}

function resolvable(fromFile: string, spec: string): boolean {
	const base = resolve(dirname(fromFile), spec);
	const candidates = [base, `${base}.ts`, join(base, "index.ts")];
	try {
		return candidates.some((c) => {
			try {
				return statSync(c).isFile();
			} catch {
				return false;
			}
		});
	} catch {
		return false;
	}
}

describe("no bare relative imports in function-shipped code", () => {
	it("every runtime relative specifier has an explicit extension", () => {
		const violations: string[] = [];
		for (const dir of SCAN_DIRS) {
			for (const file of tsFiles(join(root, dir))) {
				// Type declarations and comments vanish at compile / never
				// resolve; strip them so only runtime specifiers are checked.
				const src = readFileSync(file, "utf8")
					.replace(/\/\*[\s\S]*?\*\//g, "")
					.split("\n")
					.filter(
						(line) =>
							!/^\s*type\s/.test(line) && !line.trimStart().startsWith("//"),
					)
					.join("\n");
				const specs = new Set<string>();
				for (const re of [SPEC_RE, DYNAMIC_RE]) {
					re.lastIndex = 0;
					for (const m of src.matchAll(re)) specs.add(m[1]);
				}
				for (const spec of specs) {
					if (!/\.(js|ts|json)$/.test(spec)) {
						violations.push(`${file} -> ${spec} (missing extension)`);
					} else if (!resolvable(file, spec.replace(/\.js$/, ""))) {
						// .js specifiers map to .ts sources in-repo.
						violations.push(`${file} -> ${spec} (unresolvable)`);
					}
				}
			}
		}
		expect(violations, violations.join("\n")).toEqual([]);
	});
});
