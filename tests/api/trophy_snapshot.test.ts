import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeSvg } from "../../streak/src/compare_helpers";
import { renderTrophySVG } from "../../trophy/src/renderer";

describe("Trophy renderer snapshot", () => {
	it("matches normalized ryo-ma golden", () => {
		const out = renderTrophySVG({
			username: "ryo-ma",
			theme: "flat",
			columns: 4,
		});
		const goldenPath = join(
			__dirname,
			"..",
			"snapshots",
			"trophy",
			"ryo-ma.svg",
		);
		const golden = readFileSync(goldenPath, "utf8");

		const a = normalizeSvg(out);
		const b = normalizeSvg(golden);

		expect(a).toBe(b);
	});
});
