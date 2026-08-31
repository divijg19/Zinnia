import { describe, expect, it, vi } from "vitest";
import { computeEtag, setEtagAndAlwaysSend200 } from "../../api/_utils";

function makeRes() {
	return {
		setHeader: vi.fn(),
		status: vi.fn().mockReturnThis(),
	} as unknown as {
		setHeader: ReturnType<typeof vi.fn>;
		status: ReturnType<typeof vi.fn>;
	};
}

describe("setEtagAndAlwaysSend200 (always-200 + ETag contract)", () => {
	it("sets an ETag header derived from the body", () => {
		const body = "<svg>HELLO</svg>";
		const res = makeRes();
		setEtagAndAlwaysSend200(res, body);
		expect(res.setHeader).toHaveBeenCalledWith(
			"ETag",
			`"${computeEtag(body)}"`,
		);
	});

	it("never changes the response status to 304", () => {
		const res = makeRes();
		setEtagAndAlwaysSend200(res, "<svg>OK</svg>");
		expect(res.status).not.toHaveBeenCalled();
	});

	it("is a no-op that still sets ETag even when no request headers are relevant", () => {
		const body = "<svg>A</svg>";
		const res = makeRes();
		setEtagAndAlwaysSend200(res, body);
		expect(res.setHeader).toHaveBeenCalledWith("ETag", expect.any(String));
	});
});
