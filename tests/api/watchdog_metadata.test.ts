import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeReq, makeRes } from "../_resShim";

describe("/api/streak/metadata exposes watchdog gradient token", () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it("includes raw background token for watchdog in metadata", async () => {
        const mod = await import("../../streak/api/metadata.ts");
        const handler = mod.default;

        const req: any = makeReq("/api/streak/metadata");
        const res: any = makeRes();

        await handler(req, res);

        const body = res.send.mock.calls[0][0] as string;
        const parsed = JSON.parse(body);
        const bg = parsed?.themes?.watchdog?.background as string | undefined;
        expect(typeof bg).toBe("string");
        expect(bg.includes(",")).toBe(true);
    });
});
