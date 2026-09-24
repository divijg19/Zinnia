import { vi } from "vitest";

export type MockFn = ReturnType<typeof vi.fn>;

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
