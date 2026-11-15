#!/usr/bin/env bun
/**
 * Build the demo page.
 *
 * The demo is a browser app: TypeScript sources bundled into a single ESM
 * file that `demo/index.html` loads with `<script type="module">`. The
 * bundle is a build artifact, not a source file, so it is not tracked.
 *
 * Only the files the page needs are published: the markup, the stylesheet,
 * the bundle, the generated theme registry and the prerendered card assets.
 */
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const demoDir = join(root, "demo");
const outDir = join(root, "public", "demo");
const bundle = join(demoDir, "app.js");

// The bundle is what the page loads. Bun resolves the TypeScript sources and
// their relative imports; the result is one file the browser can run.
execFileSync(
	"bun",
	["build", "demo/app.ts", "--outfile", bundle, "--target", "browser"],
	{ cwd: root, stdio: "inherit" },
);

// Publish what the page needs, and nothing else.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
for (const file of ["index.html", "styles.css", "theme-registry.json"]) {
	cpSync(join(demoDir, file), join(outDir, file));
}
cpSync(bundle, join(outDir, "app.js"));
cpSync(join(demoDir, "assets"), join(outDir, "assets"), { recursive: true });

console.log(`Demo page built in ${outDir}`);
