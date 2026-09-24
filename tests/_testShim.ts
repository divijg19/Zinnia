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
export { restorePatEnv, snapshotPatEnv } from "./_patEnv.js";
export type { MockFn, TestRequest, TestResponse } from "./_resShim.js";
export { headerValue, makeReq, makeRes } from "./_resShim.js";
