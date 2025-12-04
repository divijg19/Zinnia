# Contribution Guide

## Environment

- Node.js 20.x
- [Vercel](https://vercel.com/) (local dev and deploy)
- GitHub API v4 (used by upstream service via PAT-based proxy)

## Local Run

Create a `.env` file at the repo root (optional) to configure cache TTLs. Trophy uses PAT rotation (`PAT_1..PAT_5`) and the `?mode=` query parameter instead of a `TROPHY_TOKEN` env:

```properties
TROPHY_CACHE_SECONDS=300
CACHE_SECONDS=300
```

Run locally with Vercel:

```sh
# from repo root
pnpm dlx vercel dev
# or
bunx vercel dev
```

Then open:

http://localhost:3000/api/trophy?username=ryo-ma

## Editor config

Read the [.editorconfig](./.editorconfig)

## Pull Requests

Pull requests are always welcome! In general, they should a single concern in
the least number of changed lines as possible. For changes that address core
functionality, it is best to open an issue to discuss your proposal first. I
look forward to seeing what you come up with!

## What to do before contributing

1) Lint & format (Biome):

```sh
bun run lint
bun run format
```

2) Type-check (TS):

```sh
bun run type-check
```

3) Tests (repo-wide):

```sh
bun run test
```
