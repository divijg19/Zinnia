import { describe, expect, it } from "vitest";
import health from "../../api/health";
import healthz from "../../api/healthz";
import type { RequestLike, ResponseLike } from "../../streak/src/server_types";
import { headerValue, makeReq, makeRes } from "../_testShim";

describe("/api/healthz", () => {
	it("answers a machine-readable readiness probe", async () => {
		const res = makeRes();
		await healthz(
			makeReq("/api/healthz") as unknown as RequestLike,
			res as unknown as ResponseLike,
		);

		expect(res._status()).toBe(200);
		expect(headerValue(res, "content-type")).toContain("application/json");
		expect(headerValue(res, "x-ready")).toBe("1");
		expect(JSON.parse(res._body())).toEqual({ ok: true });
		// A readiness probe must not be answered from a cache.
		expect(headerValue(res, "cache-control")).toContain("no-store");
	});

	it("stays reachable when the response object rejects late headers", () => {
		const res = {
			setHeader() {
				throw new Error("headers already sent");
			},
			status() {
				return res;
			},
			send: (body: string) => {
				res.body = body;
				return res;
			},
			body: "",
		} as unknown as ResponseLike & { body: string };

		healthz(
			makeReq("/api/healthz") as unknown as RequestLike,
			res as unknown as ResponseLike,
		);
		expect(JSON.parse(res.body)).toEqual({ ok: true });
	});
});

describe("/api/health", () => {
	it("does not label a healthy render as a transient failure", async () => {
		const res = makeRes();
		await health(makeReq("/api/health") as never, res as never);

		// `X-Cache-Status` is how every card route reports which tier answered.
		// A successful static card calling itself `transient` makes the header
		// useless for telling a degraded response from a healthy one.
		expect(headerValue(res, "x-cache-status")).toBe("static");
		expect(res._body()).toContain("<svg");
	});
});
