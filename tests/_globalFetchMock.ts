import { vi } from "vitest";

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
