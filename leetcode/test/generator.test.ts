import { describe, it, expect } from "vitest";
import { sanitize } from "./../packages/cloudflare-worker/src/sanitize";
import { Generator, type Config } from "./../packages/core/src/index";

describe("generator", () => {
  it("renders basic svg for us site", async () => {
    const cfg = sanitize({ username: "divijg19", site: "us" }) as unknown as Config;
    const gen = new Generator(null as unknown as Cache, { "user-agent": "vitest" });
    const svg = await gen.generate(cfg);
    expect(svg).toContain("<svg");
    expect(svg).toContain("divijg19");
  });
});
