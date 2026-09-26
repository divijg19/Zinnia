import { describe, expect, it } from "vitest";
import { removeAnimations } from "../../streak/src/card_helpers";

// `removeAnimations` is the only SVG sanitizer on the render path (it used to
// have an opt-in DOM-based branch behind SVG_DOM_SANITIZE, which never ran and
// which masked gaps in the regex path). These cases pin the behaviours.
describe("removeAnimations", () => {
	it("passes empty input through unchanged", () => {
		expect(removeAnimations("")).toBe("");
	});

	it("strips script elements in both paired and self-closing form", () => {
		expect(removeAnimations("<svg><script>a()</script><rect/></svg>")).toBe(
			"<svg><rect/></svg>",
		);
		expect(removeAnimations('<svg><script src="x"/><rect/></svg>')).toBe(
			"<svg><rect/></svg>",
		);
	});

	it("strips style blocks", () => {
		expect(
			removeAnimations("<svg><style>@keyframes f{}</style><g/></svg>"),
		).toBe("<svg><g/></svg>");
	});

	it("strips SMIL elements in paired form", () => {
		expect(
			removeAnimations('<svg><animate attributeName="x"></animate></svg>'),
		).toBe("<svg></svg>");
	});

	// Regression: the paired-only patterns left every self-closing SMIL element
	// in the output. The DOM-based branch used to hide this, but never ran.
	it("strips SMIL elements in self-closing form", () => {
		expect(removeAnimations('<svg><animate attributeName="x"/></svg>')).toBe(
			"<svg></svg>",
		);
		expect(
			removeAnimations('<svg><animateTransform attributeName="x"/></svg>'),
		).toBe("<svg></svg>");
		expect(removeAnimations('<svg><animateMotion path="p"/></svg>')).toBe(
			"<svg></svg>",
		);
		expect(removeAnimations('<svg><set to="1"/></svg>')).toBe("<svg></svg>");
	});

	it("removes a SMIL <set> that targets a javascript: href", () => {
		const out = removeAnimations(
			'<svg><set attributeName="href" to="javascript:x()"/></svg>',
		);
		expect(out).toBe("<svg></svg>");
		expect(out).not.toContain("javascript:");
	});

	// The tag names share a prefix, so the patterns must be word-bounded and
	// matched per tag rather than one pattern swallowing another tag's form.
	it("does not remove unrelated tags that share a prefix", () => {
		expect(removeAnimations("<svg><settings>x</settings></svg>")).toBe(
			"<svg><settings>x</settings></svg>",
		);
	});

	it("strips inline event handlers and javascript: hrefs", () => {
		expect(removeAnimations('<svg onload="x()"><rect/></svg>')).toBe(
			"<svg><rect/></svg>",
		);
		expect(removeAnimations('<svg><a href="javascript:x">t</a></svg>')).toBe(
			"<svg>t</svg>",
		);
	});

	it("unwraps anchors but keeps their children", () => {
		expect(removeAnimations('<svg><a href="https://x">label</a></svg>')).toBe(
			"<svg>label</svg>",
		);
	});

	it("normalizes opacity 0 to 1 so text stays visible in embeds", () => {
		expect(
			removeAnimations('<svg><text style="opacity:0;">hi</text></svg>'),
		).toContain("opacity: 1;");
	});

	it("leaves markup without animation or script content untouched", () => {
		const svg = '<svg width="1" height="1"><rect width="1" height="1"/></svg>';
		expect(removeAnimations(svg)).toBe(svg);
	});
});
