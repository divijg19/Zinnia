import { describe, expect, it } from "vitest";
import { generateCard } from "../../streak/src/card.js";
import type { Stats } from "../../streak/src/types_public";

const baseStats: Stats = {
    mode: "daily",
    totalContributions: 0,
    firstContribution: "2020-01-01",
    longestStreak: { start: "2020-01-01", end: "2020-01-01", length: 0 },
    currentStreak: { start: "2020-01-01", end: "2020-01-01", length: 0 },
};

describe("gradient parsing (linear + radial)", () => {
    it("embeds a linearGradient and url(#bggrad-) for gradient tokens", () => {
        const svg = generateCard(baseStats, { background: "45,#8A2386,#E94056,#F27120" });
        expect(svg).toContain("<linearGradient");
        expect(svg).toMatch(/url\(#bggrad-[0-9a-f]+\)/);
        expect(svg).toContain("#8A2386");
        expect(svg).toContain("#E94056");
    });

    it("embeds a radialGradient and url(#bggrad-) for radial tokens", () => {
        const svg = generateCard(baseStats, { background: "radial,#fff,#000" });
        expect(svg).toMatch(/<radialGradient[^>]*id='bggrad-[0-9a-f]+'/);
        expect(svg).toMatch(/url\(#bggrad-[0-9a-f]+\)/);
    });

    it("generates deterministic gradient ids for identical backgrounds and differs for different ones", () => {
        const svgA = generateCard(baseStats, { background: "30,#111111,#222222" });
        const svgB = generateCard(baseStats, { background: "30,#111111,#222222" });
        const svgC = generateCard(baseStats, { background: "30,#111111,#333333" });
        const mA = svgA.match(/url\(#(bggrad-[0-9a-f]+)\)/);
        const mB = svgB.match(/url\(#(bggrad-[0-9a-f]+)\)/);
        const mC = svgC.match(/url\(#(bggrad-[0-9a-f]+)\)/);
        expect(mA).toBeTruthy();
        expect(mB).toBeTruthy();
        expect(mC).toBeTruthy();
        if (mA && mB && mC) {
            expect(mA[1]).toEqual(mB[1]);
            expect(mA[1]).not.toEqual(mC[1]);
        }
    });
});
