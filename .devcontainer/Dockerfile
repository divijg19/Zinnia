FROM mcr.microsoft.com/vscode/devcontainers/base:ubuntu-24.04

# Slimmed for this repo: a Bun + Node 24 TypeScript monorepo. The PHP/Composer
# and Inkscape layers of the old template are gone — streak's PHP image lives
# in streak/Dockerfile and nothing in dev needs Inkscape. fontconfig stays:
# SVG/font rendering and tests depend on system fonts.
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends \
    git curl build-essential ca-certificates fontconfig fonts-dejavu-core \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Node 24 matches .nvmrc, package.json engines, and CI. Installed via
# NodeSource so the version is pinned, not whatever the base image ships.
RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && node --version

# Bun 1.3.14 matches package.json packageManager. Pinned and loud: a failed
# toolchain install must fail the build, never silently continue.
RUN curl -fsSL https://bun.sh/install | bash -s -- bun-v1.3.14 \
    && /root/.bun/bin/bun --version
ENV PATH="/root/.bun/bin:${PATH}"

USER vscode
WORKDIR /workspaces/zinnia
