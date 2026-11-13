/**
 * The embed contract, in one place.
 *
 * The smoke check and the warmer ask the same questions of a card response -
 * is it a 200, is it an SVG, is it cacheable, does it render - so the
 * definition lives here instead of being copied into each script. A card that
 * satisfies one script satisfies the other by construction.
 *
 * Why the contract exists at all: GitHub Camo fetches an embedded image with
 * a ten second socket timeout and does not cache a failure. A response that
 * is slow, mislabelled or structurally broken therefore does not render at
 * all - it shows up as a broken image on the profile page, with nothing in
 * the browser to explain why.
 */

/** One card URL, as it appears in the README of a GitHub profile. */
export type EmbedSpec = {
	/** Short name used in the report. */
	name: string;
	/** Path and query, relative to the origin, e.g. `/api/stats?username=…`. */
	path: string;
};

/** The manifest: where the cards live and which ones to check. */
export type EmbedManifest = {
	/** Origin that serves the cards, e.g. `https://zinnia-rho.vercel.app`. */
	baseUrl: string;
	embeds: EmbedSpec[];
};

/**
 * Read the manifest.
 *
 * The manifest is the single source of truth for the URLs that are embedded
 * in the GitHub profile README. Keeping it in one file is what stops the
 * warmer from refreshing a card that nobody embeds while a card that
 * somebody does embed goes stale.
 */
export async function loadManifest(file: string): Promise<EmbedManifest> {
	const { readFile } = await import("node:fs/promises");
	const { resolve } = await import("node:path");
	const raw = await readFile(resolve(process.cwd(), file), "utf8");
	const parsed = JSON.parse(raw) as EmbedManifest;
	if (!parsed.baseUrl || !Array.isArray(parsed.embeds)) {
		throw new Error(`${file}: expected { baseUrl, embeds[] }`);
	}
	return parsed;
}

/**
 * Point every spec at another account.
 *
 * The manifest describes one profile. Swapping the username lets the same
 * contract be checked against any account without editing the file.
 */
export function withUser(
	embeds: EmbedSpec[],
	user: string | undefined,
): EmbedSpec[] {
	if (!user) return embeds;
	return embeds.map((embed) => {
		const separator = embed.path.indexOf("?");
		const path = separator === -1 ? embed.path : embed.path.slice(0, separator);
		const query = separator === -1 ? "" : embed.path.slice(separator + 1);
		const params = new URLSearchParams(query);
		if (params.has("username")) params.set("username", user);
		else if (params.has("user")) params.set("user", user);
		const next = params.toString();
		return { ...embed, path: next ? `${path}?${next}` : path };
	});
}

/**
 * The `<style>` blocks of an SVG body.
 */
export function styleBlocks(body: string): string[] {
	return [...body.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(
		(match) => match[1] ?? "",
	);
}

/**
 * Selectors whose base state is `opacity: 0`, outside any keyframes.
 *
 * An element that only becomes visible when an animation runs is invisible
 * wherever animations do not run: a reader with reduced motion, an embedder
 * that suppresses motion, or a renderer that drops the style block. The card
 * then renders blank, which reads as a broken embed.
 */
export function hiddenByAnimation(body: string): string[] {
	const found: string[] = [];
	for (const block of styleBlocks(body)) {
		const withoutKeyframes = block.replace(
			/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\}\s*)*[^{}]*\}/g,
			"",
		);
		for (const match of withoutKeyframes.matchAll(
			/([^{}]*)\{opacity:\s*0\s*[;}]/g,
		)) {
			found.push((match[1] ?? "").trim());
		}
	}
	return found;
}

/**
 * Structural checks on the SVG body.
 *
 * A full XML parse is not available in Bun without adding a dependency, so
 * this checks what actually breaks embeds: a root `<svg>` that carries
 * intrinsic `width`/`height` (without them a browser falls back to 300x150
 * and the card renders at the wrong size), a `viewBox`, and a closed root
 * element.
 *
 * It also enforces two invariants a malformed or fragile stylesheet breaks,
 * both of which reached production. Every `<style>` block must have balanced
 * braces: a stray `}` once landed directly on top of a theme's `:root` rules,
 * so the parser discarded the palette and the card rendered as a white
 * rectangle with most of its content invisible - correct on the machine that
 * built it, broken on a phone. And no element may be hidden by a base
 * `opacity: 0` that only an animation reveals, which is blank wherever
 * animations do not run.
 */
export function inspectSvg(body: string): string[] {
	const problems: string[] = [];
	if (!body.includes("<svg")) problems.push("empty/non-SVG body");
	if (body.includes("ZINNIA_ERR:"))
		problems.push("error card (ZINNIA_ERR marker)");
	if (body.includes("NaN")) problems.push("NaN in output");

	const root = /<svg\b([^>]*)>/.exec(body)?.[1];
	if (!root) {
		problems.push("no <svg> root element");
		return problems;
	}
	for (const attr of ["width", "height", "viewBox"]) {
		if (!new RegExp(`\\b${attr}=["']`).test(root)) {
			problems.push(`root <svg> has no ${attr}`);
		}
	}
	if (!/<\/svg>\s*(?:<!--[\s\S]*?-->\s*)?$/.test(body.trim())) {
		problems.push("root <svg> is not closed");
	}

	for (const block of styleBlocks(body)) {
		let depth = 0;
		let wentNegative = false;
		for (const ch of block) {
			if (ch === "{") depth += 1;
			else if (ch === "}") {
				depth -= 1;
				if (depth < 0) wentNegative = true;
			}
		}
		if (wentNegative) problems.push("unbalanced } in a <style> block");
		if (depth > 0) problems.push("unterminated rule in a <style> block");
	}
	const hidden = hiddenByAnimation(body);
	if (hidden.length) {
		problems.push(
			`${hidden.length} element(s) hidden until an animation runs (${hidden[0]})`,
		);
	}
	return problems;
}

/** What was observed on the wire, for {@link checkCardResponse}. */
export type CardObservation = {
	status: number;
	contentType: string;
	etag: string;
	cacheControl: string;
	body: string;
	ms: number;
	budgetMs: number;
};

/**
 * Check one card response against the embed contract.
 *
 * Every problem is returned rather than thrown, so a caller can report all
 * of them at once instead of one per run.
 */
export function checkCardResponse(observation: CardObservation): string[] {
	const problems: string[] = [];
	const { status, contentType, etag, cacheControl, body, ms, budgetMs } =
		observation;

	if (status !== 200) problems.push(`status ${status} (want 200)`);
	if (!contentType.includes("image/svg"))
		problems.push(`content-type ${JSON.stringify(contentType)}`);
	if (!etag) problems.push("missing ETag");
	const maxAge = /max-age=(\d+)/.exec(cacheControl)?.[1];
	if (maxAge === undefined || maxAge === "0") {
		problems.push(`uncacheable Cache-Control ${JSON.stringify(cacheControl)}`);
	}
	if (ms > budgetMs) {
		problems.push(`${ms}ms exceeds ${budgetMs}ms budget`);
	}
	problems.push(...inspectSvg(body));
	return problems;
}

/**
 * The query parameter that forces the CDN to miss.
 *
 * `_`-prefixed parameters are deliberately excluded from the render cache
 * key, so this busts the CDN without evicting the card it is meant to
 * refresh.
 */
export function cacheBustParam(): string {
	return `_cb=${Math.random().toString(36).slice(2)}`;
}

/** Join an origin and a path without doubling the slash. */
export function joinUrl(base: string, path: string): string {
	return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

/** What a card request produced. */
export type CardResult = {
	status: number;
	ms: number;
	bytes: number;
	/** The route's own cache tier: `hit`, `miss`, `stale`, `fallback`. */
	cacheStatus: string;
	/** Every contract violation found; empty when the card is healthy. */
	problems: string[];
	/** How many requests it took to get there. */
	attempts: number;
};

/**
 * Fetch a card and check it against the contract.
 *
 * A card that breaks the contract is retried: the first request after an
 * idle period pays the platform's cold start, which says something about the
 * deployment rather than about the card. A genuinely slow or broken card
 * fails again on the retry.
 */
export async function fetchCard(
	url: string,
	budgetMs: number,
	retries = 0,
): Promise<CardResult> {
	let result: CardResult = {
		status: 0,
		ms: 0,
		bytes: 0,
		cacheStatus: "-",
		problems: ["not requested"],
		attempts: 0,
	};

	for (let attempt = 0; attempt <= retries; attempt++) {
		let problems: string[] = [];
		let status = 0;
		let ms = 0;
		let bytes = 0;
		let cacheStatus = "-";

		try {
			const started = Date.now();
			const response = await fetch(url);
			status = response.status;
			const contentType = response.headers.get("content-type") ?? "";
			const etag = response.headers.get("etag") ?? "";
			const cacheControl = response.headers.get("cache-control") ?? "";
			cacheStatus = response.headers.get("x-cache-status") ?? "-";
			const body = await response.text();
			ms = Date.now() - started;
			bytes = Buffer.byteLength(body);

			problems = checkCardResponse({
				status,
				contentType,
				etag,
				cacheControl,
				body,
				ms,
				budgetMs,
			});
		} catch (error) {
			problems = [`fetch failed: ${String(error)}`];
		}

		result = {
			status,
			ms,
			bytes,
			cacheStatus,
			problems,
			attempts: attempt + 1,
		};
		if (problems.length === 0) break;
	}
	return result;
}
