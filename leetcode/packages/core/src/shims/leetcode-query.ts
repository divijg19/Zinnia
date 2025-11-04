export class LeetCode {
	async graphql({
		query,
		variables,
		headers,
		..._rest
	}: {
		query: string;
		variables?: unknown;
		headers?: Record<string, string>;
	} & Record<string, unknown>) {
		const res = await fetch("https://leetcode.com/graphql", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				...headers,
			},
			body: JSON.stringify({ query, variables }),
		});
		if (!res.ok) {
			throw new Error(`LeetCode GraphQL failed: ${res.status}`);
		}
		return res.json();
	}
	// Compatibility no-op event emitter API
	once(_event?: string, _handler?: (...args: unknown[]) => unknown): void {}
	async user_contest_info(..._args: unknown[]): Promise<unknown> {
		return {};
	}
	async user_contest_ranking(..._args: unknown[]): Promise<unknown[]> {
		return [];
	}
}

export type ContestInfo = unknown;
export type ContestRanking = unknown;
