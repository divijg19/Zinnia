import { describe, expect, it } from "vitest";
import { computeEtag, setEtagAndAlwaysSend200 } from "../../api/_utils";
import { makeRes } from "../_testShim";

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
