# Changelog

Notable changes to the `streak/` package.

## Unreleased

- Ported the package from PHP to TypeScript.
  - Core modules: `fetcher`, `stats`, `card` (SVG renderer), `card_helpers`, `themes`, `translations`, and `cache`.
  - Deterministic gradients (linear and radial), ETag/304 parity, and PNG conversion through `sharp`.
  - Vitest unit tests and `tsc` type-checking.
  - A GitHub Actions workflow running type-check and tests on pull requests.
- Completed the renderer port with deterministic gradients and LRU caches.
- Fixed stream handling and `Buffer`/`Uint8Array` interop in the compare helpers.
- Added a structural SVG comparator and compare integration tests.
- Replaced default exports with named exports and consolidated the public types.
- Removed the original PHP sources.

## Notes

- Visual pixel-regression tests are still worth adding before the PHP path is considered fully retired.
- `sharp` availability depends on the runtime. On a target without native module support, the route serves the SVG fallback instead of a PNG.
