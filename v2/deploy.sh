#!/bin/bash
set -e

# Linkwarden v2 Production Deployment Script
# Usage: ./deploy.sh [--build] [--port PORT]

# Defaults
BUILD=false
PORT=${PORT:-3000}
DATA_DIR="${DATA_DIR:-$HOME/.michi_reader}"

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -b|--build) BUILD=true ;;
        -p|--port) PORT="$2"; shift ;;
        -d|--data-dir) DATA_DIR="$2"; shift ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Export for docker-compose
export PORT=$PORT
export HOST=${HOST:-$(hostname | awk '{print $1}')}
export DATA_DIR=$DATA_DIR

echo "=== Linkwarden v2 Deployment ==="
echo "Port: $PORT"
echo "Data directory: $DATA_DIR"
echo ""

# Ensure data directories exist
mkdir -p "$DATA_DIR"
mkdir -p "$DATA_DIR/screenshots"

# Generate .env if missing
if [ ! -f "$DATA_DIR/.env" ]; then
    GENERATOR_SCRIPT="./scripts/generate_env.sh"
    
    if [ -f "$GENERATOR_SCRIPT" ]; then
        echo "Generating .env file in $DATA_DIR..."
        
        # Export variables for the generator script
        export DATA_DIR
        export PORT
        export HOST
        
        # Run generator
        bash "$GENERATOR_SCRIPT" --prod "$DATA_DIR"
    else
        echo "Error: Generator script not found at $GENERATOR_SCRIPT"
        echo "Please verify the repository structure."
        exit 1
    fi
else
    echo ".env file exists at $DATA_DIR/.env"
fi

# Link .env to current directory for docker-compose
ln -sf "$DATA_DIR/.env" .env

# Build if requested
if [ "$BUILD" = true ]; then
    echo ""
    echo "Building Docker image..."
    docker compose -f docker-compose.prod.yml build --no-cache
fi

# Stop old containers
echo ""
echo "Stopping old containers..."
docker compose -f docker-compose.prod.yml down --remove-orphans || true

# Start new containers
echo ""
echo "Starting Linkwarden v2 on port $PORT..."
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "=== Deployment Complete ==="
echo "Access: http://$HOST:$PORT"
echo "Data stored in: $DATA_DIR"
echo ""
echo "View logs: docker compose -f docker-compose.prod.yml logs -f"
