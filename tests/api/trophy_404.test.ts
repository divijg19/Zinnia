import { describe, expect, it, vi } from "vitest";
import { mockApiUtilsFactory, restoreMocks } from "../_mockHelpers";

function makeReq(urlPath: string) {
    return {
        headers: { host: "localhost", "x-forwarded-proto": "http" },
        url: urlPath,
    } as any;
}

function makeRes() {
    return {
        setHeader: vi.fn(),
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
    } as any;
}

describe("Trophy handler upstream 404 svg passthrough", () => {
    afterEach(() => {
        restoreMocks();
    });

    it("forwards upstream 404 SVG and sets 404 status", async () => {
        const upstreamBody = "<svg>NOTFOUND</svg>";
        vi.resetModules();
        vi.doMock("../../api/_utils", mockApiUtilsFactory({}));
        (global as any).fetch = vi.fn().mockResolvedValue({
            status: 404,
            headers: { get: (k: string) => (k === "content-type" ? "image/svg+xml" : null) },
            text: async () => upstreamBody,
        });

        const trophy = (await import("../../api/trophy.js")).default;
        const req = makeReq("/api/trophy?username=testuser&theme=light");
        const res = makeRes();
        await trophy(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith(upstreamBody);
    });
});
