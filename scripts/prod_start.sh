#!/bin/bash
set -e

# Defaults
PORT=${PORT:-3032}
HOST=${HOST:-$(hostname | awk '{print $1}')}
DATA_DIR="${DATA_DIR:-$HOME/.michi_reader}"

# Ensure .env exists (should be done by setup, but check is good)
if [ ! -f .env ]; then
    echo "Warning: .env file not found in current directory."
    echo "Please run scripts/prod_setup.sh first."
fi

echo "=== Starting Michi Reader ==="
echo "Port: $PORT"

# Stop old containers
echo "Stopping old containers..."
docker compose -f docker-compose.prod.yml down --remove-orphans || true

# Start new containers
echo "Starting containers..."
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "=== Deployment Complete ==="
echo "Access: http://$HOST:$PORT"
