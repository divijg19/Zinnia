import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	clearGlobalFetchMock,
	makeFetchResolved,
	setGlobalFetchMock,
} from "../_globalFetchMock";
import { makeReq, makeRes } from "../_resShim";

describe("/api/streak preserves gradient for watchdog theme", () => {
	beforeEach(() => {
		vi.resetModules();
		clearGlobalFetchMock();
		// ensure TS renderer path is used
		process.env.STREAK_USE_TS = "1";
	});

	it("returns an SVG containing a gradient when theme=watchdog", async () => {
		// Mock GitHub GraphQL responses used by the TS fetcher
		const graphQlResp = {
			data: {
				user: {
					createdAt: "2020-01-01T00:00:00Z",
					contributionsCollection: {
						contributionYears: [2020],
						contributionCalendar: {
							weeks: [
								{
									contributionDays: [
										{ date: "2020-01-01", contributionCount: 1 },
										{ date: "2020-01-02", contributionCount: 0 },
									],
								},
							],
						},
					},
				},
			},
		};

		setGlobalFetchMock(
			makeFetchResolved({ ok: true, json: async () => graphQlResp }),
		);

		// Mock the local fetcher used by the handler so it returns deterministic contribution days
		vi.doMock("../../streak/src/fetcher", () => ({
			fetchContributions: async (_username: string) => [
				{ date: "2020-01-01", count: 1 },
				{ date: "2020-01-02", count: 0 },
			],
		}));

		const mod = await import("../../streak/api/index.ts");
		const handler = mod.default;

		const req: any = makeReq("/api/streak?user=test&theme=watchdog");
		req.query = { user: "test", theme: "watchdog" };
		const res: any = makeRes();

		await handler(req, res);

		// Ensure headers indicate SVG
		const sent = res.send.mock.calls[0][0] as string;
		expect(sent).toContain("<svg");
		// Should include a gradient def and a url(#bggrad-...) reference
		expect(/<linearGradient|<radialGradient/.test(sent)).toBe(true);
		expect(/url\(#bggrad-/.test(sent)).toBe(true);
	});
});
