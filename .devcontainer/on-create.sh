#!/usr/bin/env bash
set -euo pipefail

# Consolidated on-create script for monorepo devcontainer.
WORKSPACE_ROOT="${WORKSPACE_ROOT:-/workspaces/zinnia}"
cd "$WORKSPACE_ROOT"

echo "Running consolidated .devcontainer on-create tasks from $WORKSPACE_ROOT"

# Example: install PHP dependencies for streak (if present)
if [ -f "streak/composer.json" ]; then
  echo "Installing PHP dependencies for streak..."
  (cd streak && composer install --no-dev --optimize-autoloader --no-interaction) || true
fi

# Example: ensure any per-package initial steps run if they have scripts
if [ -d "stats" ] && [ -f "stats/package.json" ]; then
  echo "Installing JS deps for stats (from root)..."
  if command -v bun >/dev/null 2>&1; then
    bun install || true
  else
    npm install || true
  fi
fi

echo "on-create tasks complete"
