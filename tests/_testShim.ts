/**
 * Single entry point for test doubles: response/request shims, PAT env
 * save/restore, fetch mocks, and SVG header assertions. Import from here in
 * new tests; the individual `_*.ts` modules remain for backward compat.
 */
export { assertSvgHeaders, assertSvgHeadersOnRes } from "./_assertHeaders.js";
export type { FetchMockImpl } from "./_globalFetchMock.js";
export {
	clearGlobalFetchMock,
	makeFetchRejected,
	makeFetchResolved,
	setGlobalFetchMock,
} from "./_globalFetchMock.js";
export { retryerFactory } from "./_loaderMocks.js";
export { restorePatEnv, snapshotPatEnv } from "./_patEnv.js";
export type { MockFn, TestRequest, TestResponse } from "./_resShim.js";
export { headerValue, makeReq, makeRes } from "./_resShim.js";

/**
 * Query an element the test needs.
 *
 * A test that needs an element should fail loudly when it is missing,
 * rather than silently skipping the assertion it was written for.
 */
export function requiredElement<T extends Element = HTMLElement>(
	root: ParentNode,
	selector: string,
): T {
	const found = root.querySelector<T>(selector);
	if (!found) {
		throw new Error(`requiredElement: no match for ${selector}`);
	}
	return found;
}

/**
 * Narrow a value that must be present, throwing a named error when it is not.
 *
 * The biome config forbids non-null assertions, and `expect(x).toBeDefined()`
 * does not narrow, so tests use this to make "this fixture/element/registry key
 * must exist" explicit. The message shows up in the failure output instead of a
 * bare `TypeError: Cannot read properties of undefined`.
 */
export function required<T>(value: T | null | undefined, message = "value"): T {
	if (value === null || value === undefined) {
		throw new Error(`required() missing: ${message}`);
	}
	return value;
}
