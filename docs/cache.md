# Cache Module and Environment Variables

This project uses a generic filesystem cache for SVG proxy endpoints to persist "last-known-good" SVGs and ETag metadata.

Key points

- The generic cache implementation is in `api/cache.ts`.
- By default the cache is stored under `./cache/<service>` in the repository root.
- You can override the cache directory for a specific service using an environment variable:
  - `TROPHY_CACHE_DIR` for the trophy service
  - `STREAK_CACHE_DIR` for the streak service
  - (and so on — the service name is upper-cased and suffixed with `_CACHE_DIR`)
- A global `CACHE_DIR` environment variable can be used as a fallback base directory. When set, per-service directories will be created under `<CACHE_DIR>/<service>`.

Testing

- Tests avoid creating a repo-level `cache/` by default. Use one of the following in tests or CI if you need persisted cache between processes:
  - Set `${SERVICE}_CACHE_DIR` to a temporary path for that worker (recommended).
  - Set `CACHE_DIR` to a temp directory to share across services.
- The Vitest setup and `tests/_mockHelpers.ts` provide helpers and mocks so handler tests don't touch the filesystem by default.

Notes

- The cache read/write functions are best-effort and swallow filesystem errors to avoid causing request failures.
- If you later migrate handlers to import `api/cache` directly, make sure tests mock the same module id (tests currently mock via `tests/_mockHelpers.ts`).
