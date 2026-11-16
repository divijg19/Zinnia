# Themes

96 themes live in `lib/themes/registry.ts`. Each one is a set of semantic
colour tokens, with optional per-widget `streak`, `trophy` and `leetcode`
overrides. `lib/themes/adapters/` turns a theme into the option set each
card's renderer expects.

There is no static theme table to keep in sync: the registry is the only
source, and the adapters derive from it.

```html
<img src="https://YOUR-DEPLOYMENT.vercel.app/api/stats?username=…&theme=radical" />
```

`?theme=` takes one name or a comma-separated list. Each name is checked on
its own and rewritten to its canonical spelling; the parameter is removed
only when nothing in it is a real theme, so `theme=radical,bogus` renders
`radical` rather than being discarded wholesale.

## The adapters

| Adapter                           | Card                 |
| --------------------------------- | -------------------- |
| `lib/themes/adapters/stats.ts`    | stats, top-languages |
| `lib/themes/adapters/streak.ts`   | streak               |
| `lib/themes/adapters/trophy.ts`   | trophy               |
| `lib/themes/adapters/leetcode.ts` | leetcode             |

Each adapter resolves every property through a fallback chain - the selected
theme, then the `default` theme, then a literal - so a theme that omits a
token still renders a complete card.

`tests/lib/themes/adapters.test.ts` proves each adapter reproduces the
historical theme table exactly, which is the parity contract: a change that
moves a colour is a change to every card.

## The demo

`bun run demo:dev` builds the demo and serves it from `public/demo`, the same
output the deployment ships. The demo is TypeScript too: `demo/` holds the
sources, and `bun run demo:build` bundles them into the page.

The generator (`scripts/generate-demo-assets.ts`) renders every theme in
every widget and writes the result to `demo/assets/`, along with the theme
registry the page loads. It is deterministic, and CI builds it twice and
diffs the checksums.
