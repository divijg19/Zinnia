// @ts-nocheck
import {
	Icon,
	Ranking,
	Root,
	Solved,
	TotalSolved,
	Username,
} from "./elements.js";
import { Item, resetItemCounter } from "./item.js";
import query from "./query.js";
import type { Config, Extension, FetchedData } from "./types.js";

/**
 * Raised when LeetCode data cannot be fetched.
 *
 * A dedicated type so a caller can tell "upstream is unhappy" apart from a
 * programming error, and so the failure is reported as an error card instead of
 * being rendered as though it were data.
 */
export class LeetCodeFetchError extends Error {
	public readonly cause: unknown;

	constructor(message: string, options?: { cause?: unknown }) {
		super(message);
		this.name = "LeetCodeFetchError";
		this.cause = options?.cause;
	}
}

export class Generator {
	public verbose = false;
	public config: Config = {
		username: "jacoblincool",
		site: "us",
		width: 500,
		height: 200,
		css: [],
		extensions: [],
	};
	public cache?: Cache;
	public headers: Record<string, string>;
	public fetches: Record<string, Promise<FetchedData>> = {};

	constructor(cache?: Cache, headers?: Record<string, string>) {
		this.cache = cache;
		this.headers = headers ?? {};
	}

	async generate(config: Config): Promise<string> {
		const start_time = Date.now();
		// `Item` assigns `id="_1"`, `id="_d"`, ... from a module-global counter
		// for every element that does not declare its own id. Nothing reset it on
		// the server, so consecutive renders of identical input differed in those
		// auto-ids and no card was ever byte-stable - the ETag changed on every
		// request and conditional fetches could never match. Reset per render.
		//
		// Safe under concurrency: `++counter` is globally monotonic, so ids stay
		// unique within a document even when two renders interleave. Overlapping
		// renders may draw non-contiguous numbers from the shared counter, which is
		// cosmetic.
		resetItemCounter();
		this.log("generating card for", config.username);

		this.config = config;

		const extensions =
			this.config.extensions.map(async (init) => {
				const start = Date.now();
				const ext = await init(this);
				this.log(
					`extension "${ext.name}" initialized in ${Date.now() - start} ms`,
				);
				return ext;
			}) ?? [];
		const data = (async () => {
			const start = Date.now();
			const data = await this.fetch(config.username, this.headers);
			this.log(`user data fetched in ${Date.now() - start} ms`, data.profile);
			return data;
		})();
		const body = this.body();

		const result = await this.hydrate(
			await data,
			body,
			await Promise.all(extensions),
		);
		this.log(`card generated in ${Date.now() - start_time} ms`);
		return result;
	}

	protected async fetch(
		username: string,
		headers: Record<string, string>,
	): Promise<FetchedData> {
		this.log("fetching", username);
		const cache_key = `https://leetcode-stats-card.local/data-${username.toLowerCase()}-us`;

		if (cache_key in this.fetches) {
			return this.fetches[cache_key];
		}
		const pending = this._fetch(username, headers, cache_key);
		this.fetches[cache_key] = pending;
		// `.finally()` returns a *second* promise that adopts the same rejection,
		// and nothing handled that one, so a failed fetch surfaced twice: once to
		// the caller and once as an unhandled rejection, which on a serverless
		// runtime can take the instance down. Passing both handlers to `then`
		// settles the bookkeeping either way without minting a second promise.
		const release = () => {
			delete this.fetches[cache_key];
		};
		pending.then(release, release);
		return pending;
	}

	protected async _fetch(
		username: string,
		headers: Record<string, string>,
		cache_key: string,
	): Promise<FetchedData> {
		this.log("fetching", username);
		const cached = await this.cache?.match(cache_key);
		if (cached) {
			this.log("fetch cache hit");
			return cached.json();
		} else {
			this.log("fetch cache miss");
		}

		try {
			const data = await query.us(username, headers);
			await this.cache
				?.put(
					cache_key,
					new Response(JSON.stringify(data), {
						headers: { "cache-control": "max-age=300" },
					}),
				)
				.catch(console.error);
			return data;
		} catch (err) {
			// This used to return a fabricated card: solved/total counts drawn
			// from `Math.random()`, the error message as the username, ranking 0.
			// It rendered as a plausible card rather than as an error, the route
			// reported `ok: true`, and the render cache kept it for 24 hours - so
			// a single rate-limited request pinned invented numbers onto the embed
			// for a day, with nothing in the response, the logs or `?debug=1` to
			// distinguish it from real data.
			//
			// Throw instead. The route's always-200 handler renders the standard
			// error card, `renderWithFallback` only persists successful produces,
			// and a still-fresh cached body is served in preference to an error.
			console.error(`leetcode fetch failed for ${username}`, err);
			throw new LeetCodeFetchError(
				`LeetCode data unavailable: ${(err as Error).message}`,
				{ cause: err },
			);
		}
	}

	protected body(): Record<string, (...args: unknown[]) => Item> {
		const icon = () => Icon();
		const username = (...args: unknown[]) => Username(args[0] as string);
		const ranking = (...args: unknown[]) => Ranking(args[0] as number);
		const total_solved = (...args: unknown[]) =>
			TotalSolved(args[0] as number, args[1] as number);
		const solved = (...args: unknown[]) =>
			Solved(
				args[0] as {
					easy: { solved: number; total: number };
					medium: { solved: number; total: number };
					hard: { solved: number; total: number };
					ranking: number;
				},
			);

		return { icon, username, ranking, total_solved, solved };
	}

	protected async hydrate(
		data: FetchedData,
		body: Record<string, (...args: unknown[]) => Item>,
		extensions: Extension[],
	): Promise<string> {
		this.log("hydrating");
		const ext_styles: string[] = [];

		for (const extension of extensions) {
			try {
				const start = Date.now();
				await extension(this, data, body, ext_styles);
				this.log(
					`extension "${extension.name}" hydrated in ${Date.now() - start} ms`,
				);
			} catch (err) {
				this.log(`extension "${extension.name}" failed`, err);
			}
		}

		const root = Root(this.config, data);
		if (!root.children) {
			root.children = [];
		}

		// CRITICAL: Insert theme <defs> BEFORE background rect for gradient references
		// SVG requires definitions to appear before elements that use them.
		//
		// Every theme variant contributes defs, including the light and dark
		// halves of a dual theme. Those two used to be deleted here, on the
		// grounds that "media query themes are not yet supported in defs" - but
		// the CSS those same extensions emit is still pushed into the
		// stylesheet, so every `url(#...)` a dual theme referenced pointed at a
		// definition that no longer existed and the gradient background rendered
		// flat. `<defs>` is inert markup and does not belong inside the media
		// query anyway, so emitting them unconditionally is both correct and
		// sufficient.
		//
		// When both halves name the same theme - `theme=unicorn,unicorn` - the
		// two entries are the same registry def, so emitting both would duplicate
		// every gradient id. Deduplicate on the ids a defs block contributes,
		// which holds whether the registry hands back a shared instance or builds
		// a fresh one.
		const defsIndex = root.children.findIndex(
			(child) => child.attr?.id === "default-colors",
		);
		const seenIds = new Set<string>();
		const defs: Item[] = [];
		for (const key of ["theme-ext", "theme-ext-light", "theme-ext-dark"]) {
			const factory = body[key];
			if (!factory) {
				continue;
			}
			const item = factory();
			delete body[key];
			const ids = collectIds(item);
			if (ids.length > 0 && ids.every((id) => seenIds.has(id))) {
				continue;
			}
			for (const id of ids) {
				seenIds.add(id);
			}
			defs.push(item);
		}
		if (defsIndex !== -1) {
			// Insert after <style> but before <rect id="background">
			root.children.splice(defsIndex + 1, 0, ...defs);
		}

		root.children.push(body.icon());
		delete body.icon;
		root.children.push(body.username(data.profile.username));
		delete body.username;
		root.children.push(body.ranking(data.problem.ranking));
		delete body.ranking;
		const [total, solved] = (["easy", "medium", "hard"] as const).reduce(
			(acc, level) => [
				acc[0] + data.problem[level].total,
				acc[1] + data.problem[level].solved,
			],
			[0, 0],
		);
		root.children.push(body.total_solved(total, solved));
		delete body.total_solved;
		root.children.push(body.solved(data.problem));
		delete body.solved;

		Object.values(body).forEach((item) => {
			root.children?.push(item());
		});

		const styles = [
			`@namespace svg url(http://www.w3.org/2000/svg);`,
			root.css(),
		];
		styles.push(...ext_styles);
		styles.push(`svg{opacity:1}`);
		if (this.config?.css) {
			styles.push(...this.config.css);
		}

		root.children.push(new Item("style", { content: styles.join("\n") }));

		return root.stringify();
	}

	public log(...args: unknown[]): void {
		if (this.verbose) {
			console.log(...args);
		}
	}
}

/** Every `id` in an item tree, used to deduplicate theme defs blocks. */
function collectIds(item: Item): string[] {
	const ids: string[] = [];
	const walk = (node: Item) => {
		if (node.attr?.id) {
			ids.push(String(node.attr.id));
		}
		for (const child of node.children ?? []) {
			walk(child);
		}
	};
	walk(item);
	return ids;
}
