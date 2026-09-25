# Security Policy

## Reporting

Report vulnerabilities by opening a **private security advisory** on GitHub (preferred) or contacting the maintainer directly. Do not open public issues for unpatched vulnerabilities.

## Scope notes

- Card endpoints never echo secrets: `?debug=1` diagnostics expose PAT *presence*, never values, and error paths redact tokens (`redactSecretTokens`).
- Request-supplied tokens (`Authorization` / `x-github-token` seeding) are a deliberate feature for self-hosters — don't send tokens you don't own.
- `.env` files are git-ignored; never commit tokens. If a token leaks, rotate it on GitHub and mark it exhausted (it will be skipped automatically on next sight).
