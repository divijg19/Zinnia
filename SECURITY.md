# Security Policy

## Reporting

Report a vulnerability through a private GitHub security advisory on this repository, which is the preferred channel. If that is not possible, contact the maintainer directly. Please do not open a public issue for an unpatched vulnerability.

## Scope notes

- Card endpoints never echo secrets. `?debug=1` diagnostics report whether a PAT is present, never its value, and error responses redact tokens before rendering.
- Accepting tokens from request headers (`Authorization` or `x-github-token`) is a deliberate feature for self-hosters. Only send tokens you control.
- `.env` files are git-ignored and must never be committed. If a token does leak, rotate it on GitHub; it will then be skipped automatically the next time it is seen.
