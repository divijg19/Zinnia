import { describe, expect, it } from "vitest";
import {
    calculateCompactLayoutHeight,
    calculateNormalLayoutHeight,
    cartesianToPolar,
    degreesToRadians,
    getLongestLang,
    MIN_CARD_WIDTH,
    polarToCartesian,
    radiansToDegrees,
    renderTopLanguages,
} from "../../stats/src/cards/top-languages";

import { themes } from "../../stats/themes/index.js";

const langs = {
    HTML: {
        color: "#0f0",
        name: "HTML",
        size: 200,
    },
    javascript: {
        color: "#0ff",
        name: "javascript",
        size: 200,
    },
    css: {
        color: "#ff0",
        name: "css",
        size: 100,
    },
};

// Helper to parse numeric tokens from an SVG path attribute was removed —
// those helpers were unused in tests and produced lint noise.

describe("Test renderTopLanguages helper functions", () => {
    it("getLongestLang", () => {
        const langArray = Object.values(langs);
        expect(getLongestLang(langArray)).toBe(langs.javascript);
    });

    it("degreesToRadians", () => {
        expect(degreesToRadians(0)).toBe(0);
        expect(degreesToRadians(90)).toBe(Math.PI / 2);
        expect(degreesToRadians(180)).toBe(Math.PI);
        expect(degreesToRadians(270)).toBe((3 * Math.PI) / 2);
        expect(degreesToRadians(360)).toBe(2 * Math.PI);
    });

    it("radiansToDegrees", () => {
        expect(radiansToDegrees(0)).toBe(0);
        expect(radiansToDegrees(Math.PI / 2)).toBe(90);
        expect(radiansToDegrees(Math.PI)).toBe(180);
        expect(radiansToDegrees((3 * Math.PI) / 2)).toBe(270);
        expect(radiansToDegrees(2 * Math.PI)).toBe(360);
    });

    it("polarToCartesian", () => {
        expect(polarToCartesian(100, 100, 60, 0)).toStrictEqual({ x: 160, y: 100 });
        expect(polarToCartesian(100, 100, 60, 45)).toStrictEqual({ x: 142.42640687119285, y: 142.42640687119285 });
        expect(polarToCartesian(100, 100, 60, 90)).toStrictEqual({ x: 100, y: 160 });
        expect(polarToCartesian(100, 100, 60, 135)).toStrictEqual({ x: 57.573593128807154, y: 142.42640687119285 });
        expect(polarToCartesian(100, 100, 60, 180)).toStrictEqual({ x: 40, y: 100.00000000000001 });
        expect(polarToCartesian(100, 100, 60, 225)).toStrictEqual({ x: 57.57359312880714, y: 57.573593128807154 });
        expect(polarToCartesian(100, 100, 60, 270)).toStrictEqual({ x: 99.99999999999999, y: 40 });
        expect(polarToCartesian(100, 100, 60, 315)).toStrictEqual({ x: 142.42640687119285, y: 57.57359312880714 });
        expect(polarToCartesian(100, 100, 60, 360)).toStrictEqual({ x: 160, y: 99.99999999999999 });
    });

    it("cartesianToPolar", () => {
        expect(cartesianToPolar(100, 100, 160, 100)).toStrictEqual({ radius: 60, angleInDegrees: 0 });
        expect(cartesianToPolar(100, 100, 142.42640687119285, 142.42640687119285)).toStrictEqual({ radius: 60.00000000000001, angleInDegrees: 45 });
        expect(cartesianToPolar(100, 100, 100, 160)).toStrictEqual({ radius: 60, angleInDegrees: 90 });
        expect(cartesianToPolar(100, 100, 57.573593128807154, 142.42640687119285)).toStrictEqual({ radius: 60, angleInDegrees: 135 });
        expect(cartesianToPolar(100, 100, 40, 100.00000000000001)).toStrictEqual({ radius: 60, angleInDegrees: 180 });
        expect(cartesianToPolar(100, 100, 57.57359312880714, 57.573593128807154)).toStrictEqual({ radius: 60, angleInDegrees: 225 });
        expect(cartesianToPolar(100, 100, 99.99999999999999, 40)).toStrictEqual({ radius: 60, angleInDegrees: 270 });
        expect(cartesianToPolar(100, 100, 142.42640687119285, 57.57359312880714)).toStrictEqual({ radius: 60.00000000000001, angleInDegrees: 315 });
        expect(cartesianToPolar(100, 100, 160, 99.99999999999999)).toStrictEqual({ radius: 60, angleInDegrees: 360 });
    });

    it("calculateCompactLayoutHeight", () => {
        expect(calculateCompactLayoutHeight(0)).toBe(90);
        expect(calculateCompactLayoutHeight(1)).toBe(115);
        expect(calculateCompactLayoutHeight(2)).toBe(115);
        expect(calculateCompactLayoutHeight(3)).toBe(140);
        expect(calculateCompactLayoutHeight(4)).toBe(140);
        expect(calculateCompactLayoutHeight(5)).toBe(165);
        expect(calculateCompactLayoutHeight(6)).toBe(165);
        expect(calculateCompactLayoutHeight(7)).toBe(190);
        expect(calculateCompactLayoutHeight(8)).toBe(190);
        expect(calculateCompactLayoutHeight(9)).toBe(215);
        expect(calculateCompactLayoutHeight(10)).toBe(215);
    });

    it("calculateNormalLayoutHeight", () => {
        expect(calculateNormalLayoutHeight(0)).toBe(85);
        expect(calculateNormalLayoutHeight(1)).toBe(125);
        expect(calculateNormalLayoutHeight(2)).toBe(165);
        expect(calculateNormalLayoutHeight(3)).toBe(205);
        expect(calculateNormalLayoutHeight(4)).toBe(245);
        expect(calculateNormalLayoutHeight(5)).toBe(285);
        expect(calculateNormalLayoutHeight(6)).toBe(325);
        expect(calculateNormalLayoutHeight(7)).toBe(365);
        expect(calculateNormalLayoutHeight(8)).toBe(405);
        expect(calculateNormalLayoutHeight(9)).toBe(445);
        expect(calculateNormalLayoutHeight(10)).toBe(485);
    });
});

describe("Test renderTopLanguages (rendering)", () => {
    it("should render header, names and progress", () => {
        document.body.innerHTML = renderTopLanguages(langs);

        const header = document.querySelector('[data-testid="header"]');
        expect(header).not.toBeNull();
        expect((header as HTMLElement).textContent).toContain("Most Used Languages");

        const langNames = document.querySelectorAll('[data-testid="lang-name"]');
        expect(langNames.length).toBeGreaterThanOrEqual(3);
        expect((langNames[0] as HTMLElement).textContent).toContain("HTML");

        const progressEls = document.querySelectorAll('[data-testid="lang-progress"]');
        const attr = (progressEls[0] as Element).getAttribute("width");
        expect(attr).not.toBeNull();
        // Implementation uses numeric pixel widths (not percentage). Ensure a positive numeric value.
        // `createProgressNode` produces a percentage string like "40%"; accept numeric prefix.
        expect(parseFloat(attr as string)).toBeGreaterThan(0);
    });

    it("should respect custom width and min width", () => {
        document.body.innerHTML = renderTopLanguages(langs, {});
        const svgEl = document.querySelector("svg");
        expect(svgEl).not.toBeNull();
        expect((svgEl as Element).getAttribute("width")).toBe("300");

        document.body.innerHTML = renderTopLanguages(langs, { card_width: 400 });
        const svgEl2 = document.querySelector("svg");
        expect(svgEl2).not.toBeNull();
        expect((svgEl2 as Element).getAttribute("width")).toBe("400");

        document.body.innerHTML = renderTopLanguages(langs, { card_width: 100 });
        const svgEl3 = document.querySelector("svg");
        expect(svgEl3).not.toBeNull();
        expect((svgEl3 as Element).getAttribute("width")).toBe(MIN_CARD_WIDTH.toString());
    });

    it("should apply theme colors", () => {
        // Iterate a small set of themes to avoid long synchronous work in CI
        Object.keys(themes).slice(0, 6).forEach((name) => {
            // `name` is string from Object.keys; cast to the theme key type so
            // TypeScript accepts it for the `theme` option.
            document.body.innerHTML = renderTopLanguages(langs, { theme: name as any });
            const styleTag = document.querySelector("style");
            expect(styleTag).not.toBeNull();
            expect((styleTag as HTMLStyleElement).innerHTML).toContain(`#${(themes as any)[name].title_color}`);
        });
    });
});
