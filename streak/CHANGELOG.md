# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- feat: complete TypeScript port of Streak renderer with deterministic gradients and LRU caches
- fix: robust stream handling and Buffer/Uint8Array interop in compare helpers
- test: added structural SVG comparator and compare integration tests
- refactor: remove default exports in favor of named exports; consolidate public types
- docs: developer runbook and local PHP harness for parity testing

## 0.0.0 - Unreleased
- Initial draft of TypeScript refactor and parity tooling
# Changelog — streak migration

## Unreleased

- Ported `streak` subproject from PHP to TypeScript.
  - Core modules: `fetcher`, `stats`, `card` (SVG renderer), `card_helpers`, `themes`, `translations`, `cache`.
  - Deterministic gradients (linear + radial), ETag/304 parity, PNG conversion via `sharp`.
  - Non-destructive archival of original PHP sources under `streak/archive_php/`.
  - Added Vitest unit tests and type-checking with `tsc`.
  - Added GitHub Actions workflow to run type-check and tests on PRs.

### Notes

- Visual pixel-regression tests are recommended before fully deprecating PHP in production.
- Verify `sharp` availability in your target runtime (Edge vs serverless vs Node). Provide an SVG fallback if native modules are not supported.
