export interface RequestLike {
	headers: Record<string, string | undefined>;
	url: string;
}

export interface ResponseLike {
	setHeader(name: string, value: string): void;
	status(code: number): void;
	send(body: string): void;
}

export type Handler = (
	req: RequestLike,
	res: ResponseLike,
) => Promise<void> | void;
