import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";
import { normalizeSvg } from "../../streak/src/compare_helpers";
import { renderTrophySVG } from "../../trophy/src/renderer";

test("Debug trophy diff", () => {
	const cfg = { username: "ryo-ma", theme: "flat", columns: 4 };
	const a = normalizeSvg(renderTrophySVG(cfg));
	const goldenPath = path.resolve(__dirname, "../snapshots/trophy/ryo-ma.svg");
	const bRaw = fs.readFileSync(goldenPath, "utf8");
	const b = normalizeSvg(bRaw);

	const outDir = path.resolve(__dirname, "tmp");
	fs.mkdirSync(outDir, { recursive: true });
	const curPath = path.join(outDir, "current_norm.svg");
	const goldPath = path.join(outDir, "golden_norm.svg");
	fs.writeFileSync(curPath, a);
	fs.writeFileSync(goldPath, b);
	// Print paths so the test output shows where files are
	// and provide a small inline diff snippet for quick inspection.
	// Vitest will show console logs in the run output.
	// eslint-disable-next-line no-console
	console.log("WROTE:", curPath);
	// eslint-disable-next-line no-console
	console.log("WROTE:", goldPath);

	if (a === b) {
		// eslint-disable-next-line no-console
		console.log("IDENTICAL");
		return;
	}

	const al = a.split("\n");
	const bl = b.split("\n");
	let i = 0;
	for (; i < Math.max(al.length, bl.length) && i < 1000; i++) {
		if (al[i] !== bl[i]) {
			// eslint-disable-next-line no-console
			console.log("FIRST DIFF AT LINE", i + 1);
			// eslint-disable-next-line no-console
			console.log("EXPECTED:", bl[i]);
			// eslint-disable-next-line no-console
			console.log("ACTUAL:  ", al[i]);
			break;
		}
	}

	const start = Math.max(0, i - 3);
	const end = Math.min(Math.max(al.length, bl.length), i + 12);
	// eslint-disable-next-line no-console
	console.log("\nCONTEXT LINES:");
	for (let j = start; j < end; j++) {
		// eslint-disable-next-line no-console
		console.log(
			`${j + 1}:`,
			"EXP:",
			bl[j] ?? "",
			"\n",
			"    ",
			"ACT:",
			al[j] ?? "",
		);
	}

	throw new Error("Normalized render differs from golden — see files above");
});
