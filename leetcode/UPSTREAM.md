Source: https://github.com/JacobLinCool/LeetCode-Stats-Card
Pinned commit: 43cf7fbb901ae648a25aea5863f36ad67da6a328 (previous submodule pointer)

Notes:
- Vendored into this monorepo for Node/Vercel deployment and deterministic tests.
- Local changes: Node handler wrapper under `api/`, caching headers aligned to Vercel CDN, vitest config and fixtures for deterministic tests.
- Original project may use Cloudflare Worker/Service Worker APIs; our API adapter may bypass/replace those for Vercel.

Sync strategy:
- When needed, manually diff upstream against this folder and cherry-pick relevant changes.
- Keep this file updated with the upstream commit you last synced.
