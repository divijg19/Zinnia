import { vi } from "vitest";

export type FetchMockImpl = ((...args: unknown[]) => unknown) | undefined;

export function setGlobalFetchMock(fn: FetchMockImpl) {
	// Attach to global in a typed-agnostic way but centralize the behavior
	// so tests no longer cast `(global as any).fetch` everywhere.
	// Use `vi.fn()` wrappers when appropriate in tests.
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// Attach via a typed alias to avoid `any` while still setting global.fetch
	(global as unknown as Record<string, unknown>).fetch = fn as unknown;
}

export function clearGlobalFetchMock() {
	delete (global as unknown as Record<string, unknown>).fetch;
}

export function makeFetchResolved(value: unknown) {
	return vi.fn().mockResolvedValue(value);
}

export function makeFetchRejected(err: unknown) {
	return vi.fn().mockRejectedValue(err);
}
