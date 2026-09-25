import { describe, expect, it } from "vitest";
import * as utils from "../../api/_utils";
import * as canonical from "../../lib/canonical/http_cache.js";

describe("api/_utils re-export shim", () => {
	// `api/_utils` is a pure `export *` + default re-export of the canonical
	// module. It used to be imported for real only by the (now removed) trophy
	// FS-cache round-trip test, so these assertions keep the shim contract
	// pinned: routes import through this path at runtime.
	it("re-exports the canonical functions by reference", () => {
		expect(utils.computeEtag).toBe(canonical.computeEtag);
		expect(utils.resolveCacheSeconds).toBe(canonical.resolveCacheSeconds);
		expect(utils.getCacheAdapterForService).toBe(
			canonical.getCacheAdapterForService,
		);
		expect(utils.sendSuccessSvg).toBe(canonical.sendSuccessSvg);
		expect(utils.sendShortSvg).toBe(canonical.sendShortSvg);
		expect(utils.sendFallbackSvg).toBe(canonical.sendFallbackSvg);
	});

	it("re-exports the canonical default object", () => {
		expect(utils.default).toBe(canonical.default);
		expect(utils.default.computeEtag).toBe(canonical.computeEtag);
	});

	it("computes stable etags through the shim", () => {
		const body = "<svg>OK</svg>";
		expect(utils.computeEtag(body)).toBe(canonical.computeEtag(body));
		expect(utils.computeEtag(body)).not.toBe(utils.computeEtag(`${body}x`));
	});
});
