import { vi } from "vitest";

export type MockFn = ReturnType<typeof vi.fn>;

export interface TestRequest {
	headers: Record<string, string | undefined>;
	url: string;
}

export interface TestResponse {
	setHeader: MockFn;
	getHeader: (name: string) => string | undefined;
	status: MockFn & ((code: number) => TestResponse);
	send: MockFn;
	_headers: Map<string, string>;
}

export function makeReq(
	urlPath: string,
	headers: Record<string, string> = {},
): TestRequest {
	return {
		headers: { host: "localhost", "x-forwarded-proto": "http", ...headers },
		url: urlPath,
	};
}

export function makeRes(): TestResponse {
	const headers = new Map<string, string>();
	const res = {
		setHeader: vi.fn((k: string, v: unknown) => headers.set(k, String(v))),
		getHeader: (k: string) => headers.get(k),
		status: vi.fn(() => res) as unknown as (code: number) => TestResponse,
		send: vi.fn(),
		_headers: headers,
	} as unknown as TestResponse;
	return res;
}

export function headerValue(res: TestResponse, key: string) {
	return res._headers?.get(key);
}
