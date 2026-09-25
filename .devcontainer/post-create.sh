#!/usr/bin/env bash
# Single post-create step for the devcontainer: install dependencies exactly
# as CI does. (The old on-create.sh duplicated this and carried a dead
# streak/composer.json guard; both are gone.)
set -euo pipefail

WORKSPACE_ROOT="${WORKSPACE_ROOT:-/workspaces/zinnia}"
cd "$WORKSPACE_ROOT"

echo "Installing dependencies (frozen lockfile)..."
bun install --frozen-lockfile

echo "post-create tasks complete"
