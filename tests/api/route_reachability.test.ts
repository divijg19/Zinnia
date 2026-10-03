import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * Vercel does not turn files in `api/` whose names start with an underscore
 * into functions; they are treated as shared code. `api/__health.ts` deployed
 * cleanly, its unit test passed, and `/api/__health` answered 404 forever -
 * because nothing routes to it. These checks make that class of mistake
 * impossible to reintroduce silently.
 */
type ApiFileSet = "routes" | "shared";

/**
 * Files in `api/` that Vercel turns into functions ("routes"), or the
 * underscore-prefixed shared code it deliberately refuses to route to
 * ("shared"). Underscore-prefixed directories are always shared.
 */
function apiFiles(
	dir = join(root, "api"),
	set: ApiFileSet = "routes",
): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		const shared = entry.startsWith("_");
		if (statSync(full).isDirectory()) {
			out.push(...apiFiles(full, shared ? "shared" : set));
		} else if (entry.endsWith(".ts") && !entry.endsWith(".d.ts")) {
			const bucket = shared ? "shared" : "routes";
			if (bucket === set) out.push(full);
		}
	}
	return out;
}

function documentedRoutes(): string[] {
	return readFileSync(join(root, "README.md"), "utf8")
		.split("\n")
		.filter((line) => line.trimStart().startsWith("|"))
		.flatMap((line) =>
			[...line.matchAll(/`(\/api\/[A-Za-z0-9_-]+)/g)].map(
				(m) => m[1] as string,
			),
		);
}

/** Route path a file *would* get, whether or not Vercel will actually use it. */
function wouldBeRoute(file: string): string {
	return `/api/${file.slice(join(root, "api").length + 1, -3)}`;
}

describe("api route files are actually routable", () => {
	it("never documents an underscore-prefixed file as a route", () => {
		// These are shared-code modules (`_utils.ts` re-exports the canonical
		// helpers). Vercel will not route to them, so promising one as a URL
		// is exactly the `/api/__health` bug in another shape.
		const shared = apiFiles(join(root, "api"), "shared").map(wouldBeRoute);
		expect(shared.length).toBeGreaterThan(0);
		const documented = documentedRoutes();
		expect(
			shared.filter((route) => documented.includes(route)),
			"underscore-prefixed files are never deployed as functions",
		).toEqual([]);
	});

	it("every documented probe route exists as a real handler file", () => {
		const documented = documentedRoutes();
		expect(documented.length).toBeGreaterThan(0);

		const present = apiFiles().map(wouldBeRoute);
		const vercel = readFileSync(join(root, "vercel.json"), "utf8");
		const missing = documented.filter(
			(route) => !present.includes(route) && !vercel.includes(route),
		);
		expect(missing, "documented in README.md but not routable").toEqual([]);
	});

	it("keeps the legacy readiness path working through a rewrite", () => {
		const vercel = JSON.parse(
			readFileSync(join(root, "vercel.json"), "utf8"),
		) as {
			rewrites: { source: string; destination: string }[];
		};
		const alias = vercel.rewrites.find((r) => r.source === "/api/__health");
		expect(alias?.destination).toBe("/api/healthz");
		expect(existsSync(join(root, "api/healthz.ts"))).toBe(true);
		// The alias must precede the catch-all, or it never applies.
		const aliasAt = vercel.rewrites.indexOf(alias as never);
		const catchAllAt = vercel.rewrites.findIndex(
			(r) => r.destination === "/api/$1",
		);
		expect(aliasAt).toBeGreaterThanOrEqual(0);
		expect(aliasAt).toBeLessThan(catchAllAt);
	});
});
