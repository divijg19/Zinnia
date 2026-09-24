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
 * Build a `vi.doMock` factory for the stats GraphQL retryer. Pass a fixed
 * `data` payload for the common case, or a responder when the reply depends
 * on the query variables:
 *
 *   vi.doMock("../../stats/src/common/retryer", retryerFactory(data_langs));
 */
export function retryerFactory(
	dataOrRespond: unknown | RetryResponder,
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
