#!/bin/bash
# Cleanup script: prune Docker to reclaim disk space

echo "Pruning unused Docker images and containers..."
docker system prune -af --volumes || true

echo "Cleanup complete!"
