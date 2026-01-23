#!/bin/bash
set -e

echo "=== Docker Cleanup ==="
echo "Pruning dangling images..."
docker image prune -f

# Optional: Prune builder cache to save space, but keeps layers
# docker builder prune -f
