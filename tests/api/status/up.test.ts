import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
});

describe("/api/status/up (vitest)", () => {
  it("returns true and sets cache-control when PATs valid", async () => {
    vi.doMock("../../../stats/src/common/retryer", () => ({
      retryer: async () => ({ data: { rateLimit: { remaining: 4986 } } }),
    }));

    const mod = await import("../../../stats/api/status/up.js");
    const handler = mod.default || mod;

    const req: any = { query: {} };
    const res: any = { setHeader: vi.fn(), send: vi.fn() };

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/json");
    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", expect.any(String));
    expect(res.send).toHaveBeenCalledWith(true);
  });

  it("returns false and sets no-store when retryer throws", async () => {
    vi.doMock("../../../stats/src/common/retryer", () => ({
      retryer: async () => {
        throw new Error("network error");
      },
    }));

    const mod = await import("../../../stats/api/status/up.js");
    const handler = mod.default || mod;

    const req: any = { query: {} };
    const res: any = { setHeader: vi.fn(), send: vi.fn() };

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/json");
    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(res.send).toHaveBeenCalledWith(false);
  });

  it("returns JSON and shields formats", async () => {
    vi.doMock("../../../stats/src/common/retryer", () => ({
      retryer: async () => ({ data: { rateLimit: { remaining: 10 } } }),
    }));

    const mod = await import("../../../stats/api/status/up.js");
    const handler = mod.default || mod;

    const reqJson: any = { query: { type: "json" } };
    const resJson: any = { setHeader: vi.fn(), send: vi.fn() };
    await handler(reqJson, resJson);
    expect(resJson.send).toHaveBeenCalledWith({ up: true });

    const reqShields: any = { query: { type: "shields" } };
    const resShields: any = { setHeader: vi.fn(), send: vi.fn() };
    await handler(reqShields, resShields);
    expect(resShields.send).toHaveBeenCalledWith(expect.objectContaining({ message: "up" }));
  });
});
