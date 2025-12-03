import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import {
	bodyToString,
	normalizeSvg,
} from "../../streak/src/compare_helpers.ts";

describe("compare helpers", () => {
	it("converts string, buffer and Uint8Array bodies", async () => {
		expect(await bodyToString("hello")).toBe("hello");
		expect(await bodyToString(Buffer.from("buf"))).toBe("buf");
		expect(await bodyToString(new Uint8Array(Buffer.from("u8")))).toBe("u8");
	});

	it("reads a Readable stream body", async () => {
		const r = Readable.from([Buffer.from("part1"), Buffer.from("part2")]);
		expect(
			await bodyToString(r as unknown as NodeJS.ReadableStream, 2000),
		).toBe("part1part2");
	});

	it("reads an async iterable body", async () => {
		async function* gen() {
			yield Buffer.from("a");
			yield Buffer.from("b");
		}
		expect(await bodyToString(gen(), 2000)).toBe("ab");
	});

	it("normalizes svg by removing xml header, bggrad ids and lowercasing hex", () => {
		const src =
			'<?xml version="1.0"?><svg><defs><linearGradient id="bggrad-ABC123"></linearGradient></defs><rect fill="#AaBbCc"/></svg>';
		const n = normalizeSvg(src);
		expect(n).toContain("bggrad-<id>");
		expect(n).toContain("#aabbcc");
	});
});
