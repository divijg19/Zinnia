import { describe, it, expect } from "vitest";
import { assertSvgHeaders } from "../_assertHeaders";
import * as gist from "../../stats/api/gist";
import * as index from "../../stats/api/index";

describe("stats handlers set standard SVG headers", () => {
    const cases = [
        { name: "index", handler: index.default, url: "http://local/api/?username=divijg19" },
        { name: "gist", handler: gist.default, url: "http://local/api/gist?id=abc123" },
    ];

    for (const c of cases) {
        it(`sets headers for ${c.name}`, async () => {
            const req = { method: "GET", url: c.url, headers: {} } as any;
            const resHeaders: Record<string, string> = {};
            const res = {
                setHeader: (k: string, v: string) => {
                    resHeaders[k] = v;
                },
                status: (_code: number) => { },
                send: (_body: string) => { },
            } as any;
            await c.handler(req, res);
            assertSvgHeaders(resHeaders);
            expect(resHeaders["Cache-Control"]).toBeDefined();
        });
    }
});
