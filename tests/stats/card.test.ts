import { describe, expect, it } from "vitest";
import { Card } from "../../stats/src/common/Card";
import { icons } from "../../stats/src/common/icons";
import { getCardColors } from "../../stats/src/common/utils";

describe("Card", () => {
    it("should hide border", () => {
        const card = new Card({});
        card.setHideBorder(true);
        document.body.innerHTML = card.render(``);
        const cardBg = document.querySelector('[data-testid="card-bg"]');
        expect(cardBg).not.toBeNull();
        expect((cardBg as Element).getAttribute("stroke-opacity")).toBe("0");
    });

    it("should not hide border", () => {
        const card = new Card({});
        card.setHideBorder(false);
        document.body.innerHTML = card.render(``);
        const cardBg = document.querySelector('[data-testid="card-bg"]');
        expect(cardBg).not.toBeNull();
        expect((cardBg as Element).getAttribute("stroke-opacity")).toBe("1");
    });

    it("should have a custom title and setTitle", () => {
        const card = new Card({ customTitle: "custom title", defaultTitle: "default title" });
        document.body.innerHTML = card.render(``);
        expect(document.querySelector('[data-testid="card-title"]')?.textContent).toContain("custom title");

        const card2 = new Card({});
        card2.setTitle("custom title");
        document.body.innerHTML = card2.render(``);
        expect(document.querySelector('[data-testid="card-title"]')?.textContent).toContain("custom title");
    });

    it("should hide and show title via API", () => {
        const card = new Card({});
        card.setHideTitle(true);
        document.body.innerHTML = card.render(``);
        expect(document.querySelector('[data-testid="card-title"]')).toBeNull();

        const card2 = new Card({});
        card2.setHideTitle(false);
        document.body.innerHTML = card2.render(``);
        expect(document.querySelector('[data-testid="card-title"]')).not.toBeNull();
    });

    it("title should have prefix icon when provided", () => {
        const card = new Card({ title: "ok", titlePrefixIcon: icons.contribs });
        document.body.innerHTML = card.render(``);
        expect(document.getElementsByClassName("icon")[0]).not.toBeUndefined();
    });

    it("should have proper height and width", () => {
        const card = new Card({ height: 200, width: 200, title: "ok" });
        document.body.innerHTML = card.render(``);
        const svg = document.getElementsByTagName("svg")[0];
        expect(svg.getAttribute("height")).toBe("200");
        expect(svg.getAttribute("width")).toBe("200");
    });

    it("should adjust height when title hidden", () => {
        const card = new Card({ height: 200, title: "ok" });
        card.setHideTitle(true);
        document.body.innerHTML = card.render(``);
        const svg = document.getElementsByTagName("svg")[0];
        expect(svg.getAttribute("height")).toBe("170");
    });

    it("main-card-body position depends on title visibility", () => {
        const card = new Card({ height: 200 });
        document.body.innerHTML = card.render(``);
        const main = document.querySelector('[data-testid="main-card-body"]');
        expect((main as Element).getAttribute("transform")).toBe("translate(0, 55)");

        card.setHideTitle(true);
        document.body.innerHTML = card.render(``);
        const main2 = document.querySelector('[data-testid="main-card-body"]');
        expect((main2 as Element).getAttribute("transform")).toBe("translate(0, 25)");
    });

    it("should render with correct colors and gradients", () => {
        const { titleColor, textColor, iconColor, bgColor } = getCardColors({ title_color: "f00", icon_color: "0f0", text_color: "00f", bg_color: "fff", theme: "default" });
        const card = new Card({ height: 200, colors: { titleColor, textColor, iconColor, bgColor } });
        document.body.innerHTML = card.render(``);
        const styleTag = document.querySelector("style");
        expect(styleTag).not.toBeNull();
        const content = (styleTag as HTMLStyleElement).innerHTML;
        expect(content).toContain("#f00");
        const cardBg = document.querySelector('[data-testid="card-bg"]');
        expect((cardBg as Element).getAttribute("fill")).toBe("#fff");

        // gradient case
        const { titleColor: t2, textColor: tx2, iconColor: ic2, bgColor: bg2 } = getCardColors({ title_color: "f00", icon_color: "0f0", text_color: "00f", bg_color: "90,fff,000,f00", theme: "default" });
        const card2 = new Card({ height: 200, colors: { titleColor: t2, textColor: tx2, iconColor: ic2, bgColor: bg2 } });
        document.body.innerHTML = card2.render(``);
        const cardBg2 = document.querySelector('[data-testid="card-bg"]');
        expect((cardBg2 as Element).getAttribute("fill")).toBe("url(#gradient)");
        const gradient = document.querySelector("defs #gradient");
        expect(gradient).not.toBeNull();
        expect((gradient as Element).getAttribute("gradientTransform")).toBe("rotate(90)");
        const stop1 = document.querySelector("defs #gradient stop:nth-child(1)");
        const stop2 = document.querySelector("defs #gradient stop:nth-child(2)");
        const stop3 = document.querySelector("defs #gradient stop:nth-child(3)");
        expect(stop1).not.toBeNull();
        expect((stop1 as Element).getAttribute("stop-color")).toBe("#fff");
        expect(stop2).not.toBeNull();
        expect((stop2 as Element).getAttribute("stop-color")).toBe("#000");
        expect(stop3).not.toBeNull();
        expect((stop3 as Element).getAttribute("stop-color")).toBe("#f00");
    });
});
