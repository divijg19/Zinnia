Source: https://github.com/ryo-ma/github-profile-trophy
Pinned commit: eb5e82f9dec8b37616bac4acdce9dc1a6d708c78 (imported 2025-12-22T22:46:52.043Z)

Notes:
- Vendored to replace Deno-specific implementation with a Node/Vercel-friendly proxy and a local TS SVG renderer.
- Local changes: `api/index.ts` supports `mode=proxy` (default) and `mode=local` feature flag; unified cache headers.

Sync strategy:
- The local renderer is intentionally minimal; proxy mode tracks upstream output.
- Only sync upstream changes if the proxy behavior changes.
