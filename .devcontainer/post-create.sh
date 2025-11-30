#!/usr/bin/env bash
set -euo pipefail

WORKSPACE_ROOT="${WORKSPACE_ROOT:-/workspaces/zinnia}"
cd "$WORKSPACE_ROOT"

echo "Running consolidated .devcontainer post-create tasks from $WORKSPACE_ROOT"

# Install root JS deps if missing
if [ -f "package.json" ]; then
  echo "Installing root JS dependencies..."
  if command -v bun >/dev/null 2>&1; then
    bun install || true
  else
    npm install || true
  fi
fi

echo "post-create tasks complete"
