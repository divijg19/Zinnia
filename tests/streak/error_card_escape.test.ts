import { describe, expect, it } from "vitest";

import { generateErrorCard } from "../../streak/src/card.ts";

describe("generateErrorCard message escaping", () => {
	it("escapes XML-special characters in the error message", () => {
		const svg = generateErrorCard(
			`<script>alert("x&y")</script> fetch-timeout`,
		);

		expect(svg).not.toContain("<script>");
		expect(svg).toContain(
			"&lt;script&gt;alert(&quot;x&amp;y&quot;)&lt;/script&gt;",
		);
	});

	it("leaves plain messages byte-identical and keeps card structure", () => {
		const svg = generateErrorCard("fetch-timeout");
		expect(svg).toContain(">fetch-timeout</text>");
		expect(svg).toMatch(/^<\?xml version='1.0' encoding='UTF-8'\?>/);
		expect(svg.endsWith("</svg>")).toBe(true);
	});
});
