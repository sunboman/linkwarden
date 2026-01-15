#!/bin/bash
# Build script: build Docker images without stopping running containers

echo "Building Docker images (old containers still running)..."
docker compose build --no-cache

echo "Build complete!"
