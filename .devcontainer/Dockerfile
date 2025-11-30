FROM mcr.microsoft.com/vscode/devcontainers/base:ubuntu-24.04

# Install system dependencies used by various packages
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends \
    php php-curl php-xml composer git curl build-essential ca-certificates libnss3-tools \
    inkscape fontconfig fonts-dejavu-core \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Bun (optional) and Node if needed (fallback)
RUN curl -fsSL https://bun.sh/install | bash || true

USER vscode
WORKDIR /workspaces/zinnia
