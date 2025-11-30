import { generateCard, generateErrorCard } from "../card.js";
import { normalizeDays } from "../stats.js";
import type { Stats } from "../stats.js";
import type { Params } from "../types_public.js";

function getPreviousSunday(date: string): string {
    const d = new Date(date + "T00:00:00Z");
    const day = d.getUTCDay();
    d.setUTCDate(d.getUTCDate() - day);
    return d.toISOString().slice(0, 10);
}

export function generateDemoSvg(params: Params = {}): string {
    const mode = (params.mode as string) ?? "daily";

    const demoStats: Stats = {
        mode: "daily",
        totalContributions: 2048,
        firstContribution: "2016-08-10",
        longestStreak: {
            start: "2021-12-19",
            end: "2022-03-14",
            length: 86,
        },
        currentStreak: {
            start: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            end: new Date().toISOString().slice(0, 10),
            length: 16,
        },
        excludedDays: normalizeDays(((params.exclude_days as string) || "").split(",")),
    };

    if (mode === "weekly") {
        demoStats.mode = "weekly";
        demoStats.longestStreak = {
            start: "2021-12-19",
            end: "2022-03-13",
            length: 13,
        };
        demoStats.currentStreak = {
            start: getPreviousSunday(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)),
            end: getPreviousSunday(new Date().toISOString().slice(0, 10)),
            length: 3,
        };
        delete demoStats.excludedDays;
    }

    try {
        return generateCard(demoStats, params);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        return generateErrorCard(msg, params);
    }
}

// Prefer named export `generateDemoSvg`.
