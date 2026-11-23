import { describe, expect, it } from "vitest";
import { cardIdentityParams, embedIdentity } from "../../lib/card-identity";

/**
 * One card, one identity. The render cache and the README/manifest check both
 * use this module, so an alias edit in a profile README cannot fail CI while
 * leaving the card that GitHub actually embeds unwarmed.
 */

describe("cardIdentityParams", () => {
	it("canonicalizes user to username and sorts the entries", () => {
		expect(
			cardIdentityParams(
				new URLSearchParams("theme=watchdog&user=divijg19&hide_border=true"),
			),
		).toEqual([
			["hide_border", "true"],
			["theme", "watchdog"],
			["username", "divijg19"],
		]);
	});

	it("collapses both spellings when they agree", () => {
		const entries = cardIdentityParams(
			new URLSearchParams("user=alice&username=alice&theme=dark"),
		);
		expect(entries.filter(([key]) => key === "user")).toEqual([]);
		expect(entries.filter(([key]) => key === "username")).toEqual([
			["username", "alice"],
		]);
	});

	it("keeps both spellings when they disagree", () => {
		const keys = cardIdentityParams(
			new URLSearchParams("user=alice&username=bob"),
		).map(([key]) => key);
		expect(keys).toContain("user");
		expect(keys).toContain("username");
	});
});

describe("embedIdentity", () => {
	it("matches a manifest path against an absolute README URL", () => {
		expect(
			embedIdentity(
				"https://zinnia-rho.vercel.app/api/streak?username=divijg19&hide_border=true",
			),
		).toBe(
			embedIdentity(
				"/api/streak?user=divijg19&hide_border=true",
				"https://zinnia-rho.vercel.app",
			),
		);
	});

	it("ignores parameter order", () => {
		expect(embedIdentity("https://x/api/stats?username=alice&theme=dark")).toBe(
			embedIdentity("https://x/api/stats?theme=dark&username=alice"),
		);
	});

	it("rejects URLs from another origin", () => {
		expect(
			embedIdentity(
				"https://elsewhere.test/api/stats?username=alice",
				undefined,
				"https://x",
			),
		).toBeNull();
	});

	it("returns null for an unparseable URL", () => {
		expect(embedIdentity("not a url")).toBeNull();
	});
});
