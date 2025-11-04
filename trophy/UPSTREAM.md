Source: https://github.com/ryo-ma/github-profile-trophy
Pinned commit: d9e5b3e1d3c6b49af3d3a1e5f085034ccb0e9672 (previous submodule pointer)

Notes:
- Vendored to replace Deno-specific implementation with a Node/Vercel-friendly proxy and a local TS SVG renderer.
- Local changes: `api/index.ts` supports `mode=proxy` (default) and `mode=local` feature flag; unified cache headers.

Sync strategy:
- The local renderer is intentionally minimal; proxy mode tracks upstream output.
- Only sync upstream changes if the proxy behavior changes.
