import { beforeEach, describe, it, vi } from "vitest";
import {
    clearGlobalFetchMock,
    makeFetchResolved,
    setGlobalFetchMock,
} from "../_globalFetchMock";
import { makeReq, makeRes } from "../_resShim";

describe("/api/streak embed headers", () => {
    beforeEach(() => {
        vi.resetModules();
        clearGlobalFetchMock();
    });

    it("sets Access-Control-Allow-Origin for GitHub README embeds", async () => {
        setGlobalFetchMock(
            makeFetchResolved({
                status: 200,
                headers: {
                    get: (k: string) => (k === "content-type" ? "image/svg+xml" : null),
                },
                text: async () => "<svg>OK</svg>",
            }),
        );

        const mod = await import("../../api/streak.js");
        const handler = mod.default;

        const req: any = makeReq("/api/streak?user=test&theme=watchdog");
        req.query = { user: "test", theme: "watchdog" };
        const res = makeRes();

        await handler(req as unknown as any, res as unknown as any);

        const { assertSvgHeadersOnRes } = await import("../_assertHeaders");
        assertSvgHeadersOnRes(res);
    });
});
