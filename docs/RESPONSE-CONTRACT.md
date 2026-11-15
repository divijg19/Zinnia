# The response contract

Every card route answers the same way. The contract is implemented in
`lib/canonical/http_cache.ts` and covered by
`tests/api/etag_contract.test.ts` and `tests/api/card_css_invariants.test.ts`.

## Always 200, always a card

- A response is **HTTP 200 with a renderable SVG body**. A bare 304 or an
  empty body is never sent: embedders treat both as a broken image.
- When an upstream call fails, the response is still a 200 carrying the last
  good render - or an error card when nothing is cached.

## Headers

Every response sets:

| Header                   | Value                          |
| ------------------------ | ------------------------------ |
| `ETag`                   | a digest of the body           |
| `Content-Type`           | `image/svg+xml; charset=utf-8` |
| `X-Content-Type-Options` | `nosniff`                      |
| `Vary`                   | `Accept-Encoding`              |
| `X-Cache-Status`         | which tier answered (below)    |

`X-Cache-Status` names the tier that produced the body:

| Value       | Meaning                                                                       |
| ----------- | ----------------------------------------------------------------------------- |
| `hit`       | served from the render cache                                                  |
| `miss`      | rendered now                                                                  |
| `stale`     | served from the render cache because the refresh failed or overran its budget |
| `fallback`  | a compatibility branch, not an embeddable card                                |
| `static`    | a fixed card                                                                  |
| `transient` | an error card                                                                 |

## Cards render without animation

No card depends on a CSS animation to become visible. Every property an
animation touches already holds its final value in the element's own style,
and the animation only fills `backwards`. Otherwise a reader with reduced
motion, an embedder that suppresses motion, or a renderer that drops the
style block gets a blank card.

The same rule requires every emitted `<style>` block to be brace-balanced: a
stray `}` once landed on top of a theme's `:root` rules, so the parser
discarded the palette and the card rendered as a white rectangle.
`tests/api/card_css_invariants.test.ts` and `bun run embed:smoke` both
enforce this.

## Diagnostics

`?debug=1` returns JSON instead of an image, on every card route:

```json
{
	"service": "stats",
	"ok": true,
	"stage": "done",
	"params": { "username": "…", "theme": "default" },
	"validation": { "username": true, "patConfigured": true },
	"cache": { "key": "…", "ttlSeconds": 86400, "status": "hit" },
	"timing": { "fetchMs": 812, "renderMs": 4, "totalMs": 820 },
	"render": { "bytes": 5705, "cacheSeconds": 86400 }
}
```

- The PAT is reported as present or absent, **never by value**.
- A cache hit reports no `fetchMs`, because no fetch happened.
- The debug response is never cached (`Cache-Control: no-store`).

## Error cards

An error card carries a machine-readable code in a trailing comment, so it can
be read from the body:

```
<!-- ZINNIA_ERR:STATS_INTERNAL -->
```

`ErrorCode` in `lib/errors.ts` lists them all: `STATS_RATE_LIMIT`,
`STATS_INTERNAL`, `TOP_LANGS_INTERNAL`, `TOP_LANGS_RATE_LIMIT`,
`STREAK_INTERNAL`, `TROPHY_INTERNAL`, `LEETCODE_INTERNAL`,
`LEETCODE_BUILD_MISSING`, `USER_NOT_FOUND`, `UNKNOWN`.

A username that does not resolve reports `USER_NOT_FOUND` and names the
username, instead of a generic internal error.
