# Embeds

The cards are meant to be embedded in a GitHub profile README, where GitHub
proxies every image through **Camo**. Camo fetches an origin image with a ten
second socket timeout, and it does not cache a failure: a response that
arrives too late, or with the wrong media type, renders as a broken image
rather than a slow card.

Everything in this document is about that.

## The manifest

`config/embeds.json` lists the card URLs that are embedded in the profile
README. Both scripts read it, so the card that is checked is the card that is
embedded.

```json
{
	"baseUrl": "https://zinnia-rho.vercel.app",
	"embeds": [{ "name": "stats", "path": "/api/stats?username=…" }]
}
```

## The warmer

```sh
bun run warm --base https://zinnia-rho.vercel.app
```

Re-requests every card with a cache-busting parameter. That forces the origin
to render it again while leaving the cached entry in place, which is what
keeps the render cache inside its freshness window: a card refreshed every
few hours never expires, so a visitor never pays the cold path.

The difference is visible. Measured against the live deployment, the same card
answers in **7.7s cold and 0.6s warm**. The cold number is what a visitor
sees when the cache has expired, and a cold render that runs long is not a
slow card - it is a broken image on the profile page.

The warmer asserts the same contract as the smoke check and exits non-zero
when a card breaks it, so it doubles as a health check. It retries a failing
card once, because the first request after an idle period pays the platform's
cold start rather than exposing a slow card.

## The smoke check

```sh
bun run embed:smoke --base https://zinnia-rho.vercel.app --cold --budget 5000
```

Renders every card in the manifest with a unique query string and checks the
status, the media type, the `ETag`, a cacheable `Cache-Control`, and a
structurally renderable `<svg>` with intrinsic `width`/`height`/`viewBox`, a
brace-balanced stylesheet and no element hidden behind an animation. It fails
when any response exceeds the budget: an endpoint that answers 200 in 9s is
still a blank embed, because Camo stops waiting at 10s.

Note that GitHub Camo caches each card for its `max-age`, so a newly
deployed fix does not reach a browser that already holds the old copy. Purge
Camo or use a cache-busting parameter when verifying.

## The manifest check

```sh
bun run embed:check
```

Compares the manifest with the README of the profile repository and fails
when they drift: a card that is embedded but not in the manifest is never
warmed, and a card in the manifest that nobody embeds means the manifest no
longer describes reality.

## The schedule

`.github/workflows/embeds.yml` runs all three every six hours against the
production origin: the manifest check, the warmer and the smoke check. A card
that breaks the contract therefore fails a workflow instead of a profile
page.

The pull request pipeline runs the manifest check and the contract suite
(`tests/api/embed_manifest.test.ts`), which needs neither a deployment nor a
token.

## Embedding a card

```html
<img
  src="https://zinnia-rho.vercel.app/api/stats?username=YOUR_NAME&theme=watchdog"
  alt="GitHub Stats"
/>
```

- `username` identifies the account. `?user=` works too.
- `theme` takes a name from the [theme registry](THEMES.md).
- `?debug=1` returns JSON diagnostics instead of an image - see
  [the response contract](RESPONSE-CONTRACT.md).
