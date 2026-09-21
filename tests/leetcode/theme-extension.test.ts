import { describe, expect, it } from "vitest";
import { ThemeExtension } from "../../leetcode/packages/core/src/exts/theme";
import { Item, resetItemCounter } from "../../leetcode/packages/core/src/item";
import { THEME_EXTENDS } from "../../leetcode/packages/core/src/theme/defs";
import { themes } from "../../lib/themes";

function runExtension(theme: unknown) {
	const extension = ThemeExtension();
	const body: Record<string, (...args: unknown[]) => Item> = {};
	const styles: string[] = [];
	const generator = { config: { theme } };
	return extension(generator, {}, body, styles).then(() => ({ body, styles }));
}

describe("leetcode ThemeExtension", () => {
	it("ignores unknown themes without throwing", async () => {
		const { body, styles } = await runExtension("no-such-theme");
		expect(body).toEqual({});
		expect(styles).toEqual([]);
	});

	it("ignores a missing theme config", async () => {
		const extension = ThemeExtension();
		const body: Record<string, (...args: unknown[]) => Item> = {};
		const styles: string[] = [];
		await extension({ config: {} }, {}, body, styles);
		expect(body).toEqual({});
		expect(styles).toEqual([]);
	});

	it("attaches gradient defs for unicorn", async () => {
		const { body, styles } = await runExtension("unicorn");
		expect(typeof body["theme-ext"]).toBe("function");
		resetItemCounter();
		const defs = (body["theme-ext"]() as Item).stringify();
		expect(defs).toContain('id="g-bg"');
		expect(defs).toContain('id="g-text"');
		expect(styles.join("\n")).toContain("--bg-0");
	});

	it("attaches gradient defs for watchdog", async () => {
		const { body } = await runExtension("watchdog");
		expect(typeof body["theme-ext"]).toBe("function");
		resetItemCounter();
		const defs = (body["theme-ext"]() as Item).stringify();
		expect(defs).toContain('id="g-watchdog-bg"');
		expect(defs).toContain('id="g-ring"');
	});

	it("attaches no defs for plain themes", async () => {
		const { body } = await runExtension("dark");
		expect(body["theme-ext"]).toBeUndefined();
	});

	it("covers every url(#...) palette reference with matching defs", () => {
		resetItemCounter();
		for (const [name, theme] of Object.entries(themes)) {
			const palette = theme.leetcode?.palette ?? theme.colors?.palette;
			if (!palette) continue;
			const referenced = new Set<string>();
			for (const values of Object.values(palette)) {
				for (const value of values ?? []) {
					const match = /url\(#([^)]+)\)/.exec(value);
					if (match) referenced.add(match[1]);
				}
			}
			if (referenced.size === 0) continue;
			const extended = THEME_EXTENDS[name];
			expect(extended, `THEME_EXTENDS covers '${name}'`).toBeDefined();
			const defs = (extended as Item).stringify();
			for (const id of referenced) {
				expect(defs, `'${name}' defs include '${id}'`).toContain(`id="${id}"`);
			}
		}
	});
});

describe("resetItemCounter", () => {
	it("makes generated ids deterministic", () => {
		resetItemCounter();
		const first = new Item("g").stringify();
		resetItemCounter();
		const second = new Item("g").stringify();
		expect(first).toBe(second);
		expect(first).toContain('id="_1"');
	});
});
