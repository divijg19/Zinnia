export type GenerateOutputBody =
    | string
    | Buffer
    | Uint8Array
    | NodeJS.ReadableStream
    | AsyncIterable<Uint8Array | Buffer>;
export type GenerateOutputResult = { body: GenerateOutputBody };


export function normalizeSvg(svg: string): string {
    let out = svg || "";
    out = out.replace(/<\?xml[^>]*>\s*/i, "");
    out = out.replace(/bggrad-[0-9a-fA-F]+/g, "bggrad-<id>");
    out = out.replace(/\s+/g, " ").trim();
    out = out.replace(/#([0-9a-fA-F]{3,8})/g, (m) => m.toLowerCase());
    // round long floats to 3 decimals to tolerate tiny diffs
    out = out.replace(/(-?\d+\.\d{3,})/g, (m) => {
        const n = Number(m);
        return Number.isFinite(n) ? n.toFixed(3) : m;
    });
    // strip trailing zeros for readability
    out = out.replace(/(\d+\.\d*?[1-9])0+\b/g, "$1");
    out = out.replace(/(\d+)\.0+\b/g, "$1");
    return out;
}

async function _streamToBufferWithTimeout(
    readable: NodeJS.ReadableStream,
    timeoutMs: number,
): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return await new Promise<Buffer>((resolve, reject) => {
        const onData = (chunk: Buffer | Uint8Array | string) =>
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as any));
        const onEnd = () => cleanup() && resolve(Buffer.concat(chunks as any));
        const onError = (err: Error) => cleanup() && reject(err);

        const to =
            timeoutMs > 0
                ? setTimeout(() => {
                    try {
                        const r = readable as NodeJS.ReadableStream & { destroy?: (err?: Error) => void };
                        if (typeof r.destroy === "function") r.destroy(new Error("stream read timeout"));
                    } catch {
                        // ignore
                    }
                    cleanup();
                    reject(new Error("stream read timeout"));
                }, timeoutMs)
                : null;

        function cleanup() {
            if (to) clearTimeout(to);
            readable.removeListener("data", onData);
            readable.removeListener("end", onEnd);
            readable.removeListener("error", onError);
            return true;
        }

        readable.on("data", onData);
        readable.on("end", onEnd);
        readable.on("error", onError);
    });
}

export async function bodyToString(
    body: GenerateOutputBody,
    timeoutMs = 5000,
): Promise<string> {
    if (typeof body === "string") return body;
    if (body instanceof Buffer) return body.toString("utf8");
    if (body instanceof Uint8Array) return Buffer.from(body).toString("utf8");
    if (body && typeof (body as NodeJS.ReadableStream).on === "function") {
        const buf = await _streamToBufferWithTimeout(body as NodeJS.ReadableStream, timeoutMs);
        return buf.toString("utf8");
    }
    if (body && Symbol.asyncIterator in Object(body)) {
        const chunks: Buffer[] = [];
        for await (const chunk of body as AsyncIterable<Uint8Array | Buffer>) {
            chunks.push(Buffer.from(chunk as any));
        }
        return Buffer.concat(chunks as any).toString("utf8");
    }
    // fallback
    return String(body ?? "");
}
