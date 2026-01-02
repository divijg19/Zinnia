import {
	getGithubPATWithKeyForServiceAsync,
	markPatExhaustedAsync,
} from "../../lib/tokens";
import type { ContributionDay } from "./types.ts";

// Build GraphQL query for a year's contribution calendar and optional fields
const yearQuery = (year: number) =>
	`query($login: String!) { user(login: $login) { createdAt contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${year}-12-31T23:59:59Z") { contributionYears contributionCalendar { weeks { contributionDays { date contributionCount } } } } }`;

type GraphQLVariables = Record<string, string | number | boolean | null>;

async function doGraphQL(
	query: string,
	variables: GraphQLVariables,
	pat: string,
) {
	const timeoutMs = Number(process.env.STREAK_FETCH_TIMEOUT_MS || 8000);
	const controller = new AbortController();
	const to =
		timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;
	let res: Response | undefined;

	function sanitizeVariables(
		v: GraphQLVariables | undefined | null,
	): GraphQLVariables | undefined {
		if (!v || typeof v !== "object") return undefined;
		const out: GraphQLVariables = {};
		for (const k of Object.keys(v)) {
			if (k.startsWith("__")) continue;
			const val = (v as any)[k];
			if (typeof val === "undefined") continue;
			out[k] = val as string | number | boolean | null;
		}
		return Object.keys(out).length ? out : undefined;
	}

	async function attemptFetch(): Promise<Response> {
		const payload: any = { query: String(query) };
		const safeVars = sanitizeVariables(variables);
		if (safeVars) payload.variables = safeVars;
		const bodyStr = JSON.stringify(payload);
		return fetch("https://api.github.com/graphql", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${pat}`,
				"User-Agent": "zinnia/streak-ts",
			},
			body: bodyStr,
			signal: controller.signal,
		});
	}

	try {
		res = await attemptFetch();
	} catch (err: unknown) {
		if (to) clearTimeout(to);
		const maybeName = (err as unknown as { name?: string })?.name;
		if (maybeName === "AbortError") throw new Error("fetch-timeout");
		// Safe retry once for transient network errors (not auth failures)
		const jitterMs = 200 + Math.floor(Math.random() * 201); // 200-400ms
		await new Promise((r) => setTimeout(r, jitterMs));
		try {
			res = await attemptFetch();
		} catch (err2: unknown) {
			throw err2 as Error;
		}
	} finally {
		if (to) clearTimeout(to);
	}
	if (!res) throw new Error("no response from fetch");

	if (!res.ok) {
		if (res.status === 401 || res.status === 403) {
			try {
				const keyHeader = (variables as any).__patKey as string | undefined;
				if (keyHeader) await markPatExhaustedAsync?.(keyHeader, 300);
			} catch {
				// swallow
			}
			throw new Error("rate-limited");
		}
		const text = await res
			.text()
			.catch(() => res.statusText || String(res.status));
		throw new Error(`graphql-failed:${res.status}:${text}`);
	}
	const parsed = await res.json().catch(() => null);
	// If GitHub returns a parse error like "Expected NAME..." try an inline-variables
	// retry to work around any server-side parser oddities. Only attempt when
	// a `login` variable is present.
	if (parsed && Array.isArray(parsed.errors) && parsed.errors.length > 0) {
		const firstMsg =
			typeof parsed.errors[0]?.message === "string"
				? parsed.errors[0].message
				: "";
		if (/Expected\s+NAME|Expected\s+\w+,\s+actual/i.test(firstMsg)) {
			const loginVal = (variables as any)?.login;
			if (typeof loginVal === "string" && loginVal) {
				try {
					// Build an inlined query by removing the variable declaration and
					// substituting $login occurrences with the literal value.
					let inline = String(query);
					inline = inline.replace(/\(\s*\$login\s*:\s*String!?\s*\)/g, "");
					inline = inline.replace(/\$login\b/g, JSON.stringify(loginVal));
					const fallbackPayload = JSON.stringify({ query: inline });
					const fallbackRes = await fetch("https://api.github.com/graphql", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${pat}`,
							"User-Agent": "zinnia/streak-ts",
						},
						body: fallbackPayload,
						signal: controller.signal,
					});
					if (fallbackRes?.ok) {
						const fbJson = await fallbackRes.json().catch(() => null);
						if (fbJson) return fbJson;
					}
				} catch (_e) {
					// swallow and return original parsed response below
				}
			}
		}
	}
	return parsed;
}

import {
	type ContribMeta,
	readContribCache,
	writeContribCache,
} from "./contrib_cache.ts";

export async function fetchContributions(
	username: string,
	options?: { forceRefresh?: boolean },
): Promise<ContributionDay[]> {
	const forceRefresh = !!options?.forceRefresh;
	const thisYear = new Date().getUTCFullYear();
	const patInfo = await getGithubPATWithKeyForServiceAsync("streak");

	if (!patInfo) {
		// Fallback: try to scrape the public GitHub contributions calendar
		try {
			const resp = await fetch(
				`https://github.com/users/${username}/contributions`,
			);
			if (!resp.ok) throw new Error("public-contributions-fetch-failed");
			const text = await resp.text();
			const days: ContributionDay[] = [];
			// First try legacy SVG <rect> parsing
			const reRect =
				/<rect[^>]*data-date=["']([0-9-]+)["'][^>]*data-count=["']([0-9]+)["'][^>]*>/g;
			let m: RegExpExecArray | null = reRect.exec(text);
			while (m) {
				const date = m[1];
				const countStr = m[2];
				if (date && countStr) days.push({ date, count: Number(countStr) });
				m = reRect.exec(text);
			}
			// If no <rect> entries found, try table-based layout (td + tool-tip)
			if (days.length === 0) {
				const reTd =
					/<td[^>]*data-date=["']([0-9-]+)["'][^>]*>[\s\S]*?<\/td>\s*<tool-tip[^>]*>([\s\S]*?)<\/tool-tip>/g;
				m = reTd.exec(text);
				while (m) {
					const date = m[1];
					const tip = (m[2] || "").replace(/\s+/g, " ").trim();
					let count = 0;
					const singleMatch = tip.match(/No contributions on/i);
					if (singleMatch) count = 0;
					else {
						const numMatch = tip.match(/([0-9]+) contribution/);
						if (numMatch) count = Number(numMatch[1]);
					}
					if (date) days.push({ date, count });
					m = reTd.exec(text);
				}
			}
			if (days.length > 0) {
				days.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
				return days;
			}
			// If parsing failed, fall through to GraphQL path which will error
		} catch (scrapeErr) {
			try {
				if (process.env.STREAK_DEBUG === "1")
					console.warn(
						"streak: public contributions scrape failed",
						String(scrapeErr),
					);
			} catch {}
			throw new Error("no-github-pat-or-scrape-failed");
		}
	}

	// Try cached contributions unless forced refresh
	const FULL_RESYNC_MS = Number(
		process.env.STREAK_FULL_RESYNC_MS || 72 * 60 * 60 * 1000,
	); // 72h default
	if (!forceRefresh) {
		try {
			const cached = await readContribCache(username);
			if (cached && Array.isArray(cached.days) && cached.days.length > 0) {
				const meta: ContribMeta | null = cached.meta ?? null;
				const ageMs = meta?.ts ? Date.now() - meta.ts : Infinity;
				// if cached is fresh enough, attempt incremental fetch
				if (ageMs < FULL_RESYNC_MS) {
					try {
						// Determine years to request: from cached.meta.lastDate's year to current year
						const startYear = meta?.lastDate
							? new Date(meta.lastDate).getUTCFullYear()
							: thisYear;
						const yearsToRequest: number[] = [];
						for (let y = startYear; y <= thisYear; y++) yearsToRequest.push(y);
						const newDays: ContributionDay[] = [];
						if (patInfo) {
							for (const y of yearsToRequest) {
								const result = await doGraphQL(
									yearQuery(y),
									{ login: username },
									patInfo.token,
								);
								const weeks =
									result?.data?.user?.contributionsCollection
										?.contributionCalendar?.weeks ?? [];
								for (const week of weeks) {
									for (const d of week.contributionDays) {
										newDays.push({ date: d.date, count: d.contributionCount });
									}
								}
							}
						}
						// merge cached.days and newDays
						const map = new Map<string, number>();
						for (const d of cached.days) map.set(d.date, Number(d.count) || 0);
						for (const d of newDays) map.set(d.date, Number(d.count) || 0);
						const merged = Array.from(map.entries()).map(([date, count]) => ({
							date,
							count,
						}));
						merged.sort((a, b) =>
							a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
						);
						// update meta.lastDate
						const lastDate = merged.length
							? merged[merged.length - 1]?.date
							: meta?.lastDate;
						await writeContribCache(username, merged, {
							lastDate,
							lastFullResyncTs: meta?.lastFullResyncTs,
						});
						return merged;
					} catch (err) {
						// If incremental fetch fails, fall back to returning cached data
						try {
							if (process.env.STREAK_DEBUG === "1")
								console.warn(
									"streak/fetcher: incremental fetch failed, returning cache",
									String(err),
								);
						} catch {}
						return cached.days;
					}
				}
			}
		} catch (e) {
			try {
				if (process.env.STREAK_DEBUG === "1")
					console.warn("streak/fetcher: cache read failed", String(e));
			} catch {}
			// fall through to full fetch
		}
	}

	// Ensure we have patInfo for GraphQL calls
	if (!patInfo) throw new Error("no-github-pat");

	const json = await doGraphQL(
		yearQuery(thisYear),
		{ login: username },
		patInfo.token,
	);
	try {
		if (process.env.STREAK_DEBUG === "1") {
			// eslint-disable-next-line no-console
			console.debug(
				"streak/fetcher: year=%s graphql response keys=%o",
				thisYear,
				Object.keys(json || {}),
			);
		}
	} catch {}
	const user = json?.data?.user;
	if (!user) {
		const msg = json?.errors?.[0]?.message ?? "no user data";
		// Try a scrape fallback before failing outright to keep renderer
		// deterministic for embeds. Reuse the public contributions endpoint.
		try {
			const resp = await fetch(
				`https://github.com/users/${username}/contributions`,
			);
			if (resp?.ok) {
				const text = await resp.text();
				const days: ContributionDay[] = [];
				const reRect =
					/<rect[^>]*data-date=["']([0-9-]+)["'][^>]*data-count=["']([0-9]+)["'][^>]*>/g;
				let m: RegExpExecArray | null = reRect.exec(text);
				while (m) {
					const date = m[1];
					const countStr = m[2];
					if (date && countStr) days.push({ date, count: Number(countStr) });
					m = reRect.exec(text);
				}
				if (days.length === 0) {
					const reTd =
						/<td[^>]*data-date=["']([0-9-]+)["'][^>]*>[\s\S]*?<\/td>\s*<tool-tip[^>]*>([\s\S]*?)<\/tool-tip>/g;
					m = reTd.exec(text);
					while (m) {
						const date = m[1];
						const tip = (m[2] || "").replace(/\s+/g, " ").trim();
						let count = 0;
						if (/No contributions on/i.test(tip)) count = 0;
						else {
							const numMatch = tip.match(/([0-9]+) contribution/);
							if (numMatch) count = Number(numMatch[1]);
						}
						if (date) days.push({ date, count });
						m = reTd.exec(text);
					}
				}
				if (days.length > 0) {
					days.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
					return days;
				}
			}
		} catch (scrapeErr) {
			try {
				if (process.env.STREAK_DEBUG === "1")
					console.warn(
						"streak: public contributions scrape failed",
						String(scrapeErr),
					);
			} catch {}
		}
		throw new Error(msg);
	}

	const createdAt = user.createdAt || null;
	const contributionYears =
		user.contributionsCollection?.contributionYears ?? [];
	let startYear = createdAt ? new Date(createdAt).getUTCFullYear() : thisYear;
	startYear = Math.max(2005, startYear);

	if (Array.isArray(contributionYears) && contributionYears.length > 0) {
		const firstContributionYear =
			Number(contributionYears[contributionYears.length - 1]) || startYear;
		if (firstContributionYear < startYear) startYear = firstContributionYear;
	}

	const yearsToRequest: number[] = [];
	for (let y = startYear; y <= thisYear; y++) yearsToRequest.push(y);

	const days: ContributionDay[] = [];
	for (const y of yearsToRequest) {
		const result = await doGraphQL(
			yearQuery(y),
			{ login: username },
			patInfo.token,
		);
		try {
			if (process.env.STREAK_DEBUG === "1") {
				// eslint-disable-next-line no-console
				console.debug(
					"streak/fetcher: year=%d graphql keys=%o",
					y,
					Object.keys(result || {}),
				);
			}
		} catch {}
		const weeks =
			result?.data?.user?.contributionsCollection?.contributionCalendar
				?.weeks ?? [];
		for (const week of weeks) {
			for (const d of week.contributionDays ?? []) {
				days.push({ date: d.date, count: d.contributionCount });
			}
		}
	}

	const byDate = new Map<string, number>();
	for (const d of days) byDate.set(d.date, d.count);
	const merged = Array.from(byDate.entries()).map(([date, count]) => ({
		date,
		count,
	}));
	merged.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
	// write full fetch back to cache with full resync metadata
	try {
		await writeContribCache(
			username,
			merged,
			{
				lastDate: merged.length ? merged[merged.length - 1]?.date : undefined,
				lastFullResyncTs: Date.now(),
			},
			259200,
		);
	} catch (_) {}
	return merged;
}
