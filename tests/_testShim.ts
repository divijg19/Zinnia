/**
 * The test doubles, in one place.
 *
 * Import from here: the request and response shims, the PAT env
 * save/restore, the fetch mocks, the SVG header assertions, and the
 * `vi.doMock` factories. The `vi.doMock` *call* itself always stays in the
 * test file - vitest resolves the specifier relative to the caller, so moving
 * the call into a helper silently registers the mock under a path that does
 * not exist and the real module loads instead.
 */
import { expect, type Mock, vi } from "vitest";

// `ReturnType<typeof vi.fn>` would resolve the generic to its *constraint*
// (`Procedure | Constructable`), which is not assignable to a plain function
// type. Spell the mock signature out instead, so a mock can stand in for a
// response object.
export type MockFn = Mock<(...args: any[]) => any>;

export interface TestRequest {
	headers: Record<string, string | undefined>;
	method: string;
	url: string;
}

export interface TestResponse {
	setHeader: MockFn;
	getHeader: (name: string) => string | undefined;
	status: MockFn & ((code: number) => TestResponse);
	send: MockFn;
	_headers: Map<string, string>;
	_body: () => string;
	_status: () => number;
}

export function makeReq(
	urlPath: string,
	headers: Record<string, string> = {},
): TestRequest {
	return {
		headers: { host: "localhost", "x-forwarded-proto": "http", ...headers },
		method: "GET",
		url: urlPath,
	};
}

export function makeRes(): TestResponse {
	const headers = new Map<string, string>();
	let statusCode = 200;
	let body = "";
	const res = {
		// Header names are case-insensitive on the wire; normalize to
		// lowercase so assertions need not match the handler's exact casing.
		setHeader: vi.fn((k: string, v: unknown) => {
			headers.set(String(k).toLowerCase(), String(v));
			return res;
		}),
		getHeader: (k: string) => headers.get(String(k).toLowerCase()),
		status: vi.fn((code: number) => {
			statusCode = code;
			return res;
		}) as unknown as (code: number) => TestResponse,
		send: vi.fn((b: unknown) => {
			body = typeof b === "string" ? b : b == null ? "" : String(b);
			return res;
		}),
		_headers: headers,
		_body: () => body,
		_status: () => statusCode,
	} as unknown as TestResponse;
	return res;
}

export function headerValue(res: TestResponse, key: string) {
	return res._headers?.get(String(key).toLowerCase());
}

export function assertSvgHeaders(
	headers: Record<string, string | string[] | undefined>,
) {
	const ct = (headers["Content-Type"] || headers["content-type"]) as
		| string
		| undefined;
	const xcto = (headers["X-Content-Type-Options"] ||
		headers["x-content-type-options"]) as string | undefined;
	const vary = (headers.Vary || headers.vary) as string | undefined;
	expect(ct).toContain("image/svg+xml");
	if (ct?.toLowerCase().includes("charset")) {
		expect(ct.toLowerCase()).toContain("charset=utf-8");
	}
	expect(xcto).toBe("nosniff");
	expect(vary).toContain("Accept-Encoding");
}

export function assertSvgHeadersOnRes(res: any) {
	const headers: Record<string, string | undefined> = {};
	try {
		if (res && res._headers instanceof Map) {
			for (const [k, v] of res._headers) headers[k] = String(v);
		} else if (typeof res.getHeader === "function") {
			// Node-like response
			const names = [
				"Content-Type",
				"X-Content-Type-Options",
				"Vary",
				"Access-Control-Allow-Origin",
			];
			for (const n of names) {
				const val = res.getHeader(n);
				if (val != null) headers[n] = String(val);
			}
		} else if (
			typeof res.setHeader === "function" &&
			(res.setHeader as any).mock
		) {
			// Jest/Vitest spy: collect calls
			const calls = (res.setHeader as any).mock.calls as Array<
				[string, unknown]
			>;
			for (const c of calls) {
				const k = String(c[0]);
				const v = c[1] == null ? undefined : String(c[1]);
				headers[k] = v;
			}
		}
	} catch {}
	assertSvgHeaders(headers);
}

// `any[]` rather than `unknown[]` on purpose: a typed `vi.fn((url: string,
// opts: Foo) => …)` must be assignable here, and it is not assignable to a
// `(...args: unknown[])` signature because `unknown` is not assignable to
// `string`. `any` params are bivariant, so any mock shape is accepted.
export type FetchMockImpl = ((...args: any[]) => unknown) | undefined;

export function setGlobalFetchMock(fn: FetchMockImpl) {
	// Attach to global in a typed-agnostic way but centralize the behavior
	// so tests no longer cast `(global as any).fetch` everywhere.
	// Use `vi.fn()` wrappers when appropriate in tests.
	// Attach via a typed alias to avoid `any` while still setting global.fetch
	(global as unknown as Record<string, unknown>).fetch = fn as unknown;
}

export function clearGlobalFetchMock() {
	delete (global as unknown as Record<string, unknown>).fetch;
}

// Declared as returning `FetchMockImpl` rather than leaving vitest to infer a
// `Mock<() => Response>`: that inferred type is not assignable back to
// FetchMockImpl and made every `setGlobalFetchMock(makeFetchResolved(...))`
// call a type error.
export function makeFetchResolved(value: unknown): FetchMockImpl {
	return vi.fn(async () => value);
}

export function makeFetchRejected(err: unknown): FetchMockImpl {
	return vi.fn(async () => {
		throw err;
	});
}

/**
 * Snapshot and restore `PAT_*` env vars around tests that mutate them.
 *
 * Extracted verbatim from the per-file duplicates so every wrapper test
 * saves/restores the same way.
 */
export function snapshotPatEnv(): Record<string, string | undefined> {
	const saved: Record<string, string | undefined> = {};
	for (const k of Object.keys(process.env)) {
		if (/^PAT_\d*$/.test(k)) {
			saved[k] = process.env[k];
			delete process.env[k];
		}
	}
	return saved;
}

export function restorePatEnv(saved: Record<string, string | undefined>): void {
	for (const k of Object.keys(process.env)) {
		if (/^PAT_\d*$/.test(k)) delete process.env[k];
	}
	for (const [k, v] of Object.entries(saved)) {
		if (v !== undefined) process.env[k] = v;
	}
}

/**
 * Factory builders for `vi.doMock` module mocks.
 *
 * IMPORTANT: only the *factory* lives here. The `vi.doMock(specifier,
 * factory)` call itself must stay in the test file, because vitest resolves
 * the specifier relative to the file that calls `vi.doMock` — moving the
 * call into this helper silently registers the mock under a nonexistent
 * path and the real module loads instead. (Verified empirically:
 * a `vi.doMock` moved here does not apply.) For the same reason there are
 * no overload signatures in this file: the repo's transform pipeline
 * rejects them here with a parse error.
 */

type RetryResponder = (
	fetcher: unknown,
	variables: Record<string, unknown> | undefined,
) => unknown;

/**
 * A fixed GraphQL payload. Deliberately excludes `unknown`: including it in
 * the union below would absorb `RetryResponder` and strip contextual typing
 * from the responder's parameters, making every inline arrow param an
 * implicit `any`.
 */
type RetryPayload = string | number | boolean | object | null | undefined;

/**
 * Build a `vi.doMock` factory for the stats GraphQL retryer. Pass a fixed
 * `data` payload for the common case, or a responder when the reply depends
 * on the query variables:
 *
 *   vi.doMock("../../stats/src/common/retryer", retryerFactory(data_langs));
 */
export function retryerFactory(
	dataOrRespond: RetryResponder | RetryPayload,
): () => { retryer: RetryResponder } {
	const respond: RetryResponder =
		typeof dataOrRespond === "function"
			? (dataOrRespond as RetryResponder)
			: () => ({ data: dataOrRespond });
	return () => ({
		retryer: async (
			fetcher: unknown,
			variables: Record<string, unknown> | undefined,
		) => respond(fetcher, variables),
	});
}

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
