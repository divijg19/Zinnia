import { vi } from "vitest";

export function makeReq(urlPath: string, headers: Record<string, string> = {}) {
    return {
        headers: { host: "localhost", "x-forwarded-proto": "http", ...headers },
        url: urlPath,
    } as any;
}

export function makeRes() {
    const headers = new Map<string, string>();
    const res: any = {
        setHeader: vi.fn((k: string, v: unknown) => headers.set(k, String(v))),
        getHeader: (k: string) => headers.get(k),
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
        _headers: headers,
    };
    return res as any;
}

export function headerValue(res: any, key: string) {
    return res._headers?.get(key);
}
