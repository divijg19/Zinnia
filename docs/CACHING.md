# Caching

Three caches sit between a visitor and the GitHub API: the render cache inside
the function, the platform's edge, and GitHub Camo in front of that. This
document is about how they interact and what breaks when they do not.

## The TTL

`?cache=` (seconds) wins, then the service override, then the global fallback:

```
?cache= → STATS_CACHE_SECONDS / TOP_LANGS_CACHE_SECONDS / STREAK_CACHE_SECONDS
        / TROPHY_CACHE_SECONDS / LEETCODE_CACHE_SECONDS / HEALTH_CACHE_SECONDS
        → CACHE_SECONDS → 86400 (health: 60)
```

`?cache=` is clamped to `0–604800`; a `0` or unparseable value falls back to
the base. Error and fallback responses use short, transient caching:
`no-store` on the debug JSON, at least 60s on a fallback, and at most an hour
on a fallback body, so an out-of-date card cannot be pinned downstream.

Fresh responses carry `stale-while-revalidate` and `stale-if-error`, and
deliberately **not** `must-revalidate`. `must-revalidate` forbids serving
stale, which cancels both of those directives; while it was present, every
TTL expiry sent the first visitor back down the full cold path.

## Which cache the headers reach

Vercel rewrites the client-facing `Cache-Control`: it consumes `s-maxage` and
`stale-while-revalidate` and re-emits only `max-age`. Those directives
therefore govern Vercel's own edge, and Camo is handed `max-age` alone.

The render cache below, not the header, is what removes the blank-embed path:
it answers regardless of what any intermediary does with the headers.

## The render cache

`lib/render-cache.ts` stores rendered SVGs in process memory and, when
configured, Upstash KV (`UPSTASH_REST_URL` + `UPSTASH_REST_TOKEN`). It
exists so a revalidation is answered from the previous render instead of
re-running the GitHub fetch, and so a fetch that fails still returns a card.

GitHub Camo gives up fetching an origin image after ten seconds, so a miss
inside that window rendered blank and only a refresh seemed to fix it. A
served render does not depend on the timing at all.

- `?debug=` and `?cache=` are excluded from the cache key, along with
  `_`-prefixed params: they select a response mode or a TTL rather than a
  different card. Underscore params also let `embed:smoke --cold` probe a CDN
  miss without evicting the card.
- Concurrent requests for the same card share one render. Five cards on one
  README page share a TTL, so they expire together; without coalescing that is
  five simultaneous GitHub API calls.
- The render is kept for a further `STALE_WINDOW_SECONDS` (24h) past its
  freshness window, so an upstream outage degrades to an out-of-date card
  rather than a broken one.
- `RENDER_CACHE=0` disables it. Unset KV leaves process memory only.

## The render budgets

Two budgets, because they answer different questions:

| Budget               | Default | Applies when                | Why                                                                             |
| -------------------- | ------- | --------------------------- | ------------------------------------------------------------------------------- |
| `RENDER_DEADLINE_MS` | 3500ms  | a previous render is cached | latency choice: at the budget a stale card can be served immediately            |
| `RENDER_CEILING_MS`  | 7000ms  | nothing is cached           | the real card is the only good answer, so an error card would be strictly worse |

The budget is a contract with the embedder about the **whole response**, not
just the render: the time already spent - the render cache lookup, the PAT
bootstrap - is subtracted from it, and the platform's own overhead sits in
front of all of it. The arithmetic, measured against the live deployment:

| Part                                                | Measured   |
| --------------------------------------------------- | ---------- |
| Camo's origin fetch timeout (`CAMO_SOCKET_TIMEOUT`) | 10s        |
| platform overhead (cold start, routing)             | 0.4-1.4s   |
| our budget (`RENDER_CEILING_MS`)                    | 7.0s       |
| a cold stats render, end to end                     | 5.5-6.6s   |
| a cache hit, end to end                             | 0.44-0.54s |

7.0s of budget plus the platform's 1.4s worst case puts the response at
8.4s, inside Camo's window with room for its own fetch. The previous 8500ms
ceiling could reach 9.9s - past the limit, where the answer is a 404 and a
broken image rather than a card.

The ceiling also sits above the outbound fetch budget
(`DEFAULT_FETCH_TIMEOUT_MS`, 6000ms), so a hung upstream gives up inside the
ceiling and produces the error card at a known time, rather than the deadline
firing on a producer that was still waiting on a socket. A single shared
budget got this wrong: at 3500ms roughly a quarter of cold stats renders
returned an error card instead of a card.

## Keeping the cards fresh

See [EMBEDS.md](EMBEDS.md) for the manifest, the warmer and the smoke check.
