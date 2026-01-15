#!/bin/bash
set -e
# Build script: build Docker images without stopping running containers

export DATA_DIR="${DATA_DIR:-$HOME/.linkreader}"

echo "Building Docker images (old containers still running)..."
docker compose build --no-cache

echo "Build complete!"
