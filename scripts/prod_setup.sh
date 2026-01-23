#!/bin/bash
set -e

# Defaults (can be overridden by env vars)
PORT=${PORT:-3032}
DATA_DIR="${DATA_DIR:-$HOME/.michi_reader}"

echo "=== Michi Reader Production Setup ==="
echo "Data directory: $DATA_DIR"

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
        export HOST=${HOST:-$(hostname | awk '{print $1}')}
        
        # Run generator
        bash "$GENERATOR_SCRIPT" --prod "$DATA_DIR"
    else
        echo "Error: Generator script not found at $GENERATOR_SCRIPT"
        exit 1
    fi
else
    echo ".env file exists at $DATA_DIR/.env"
fi

# Link .env to current directory for docker-compose
if [ -f "$DATA_DIR/.env" ]; then
    ln -sf "$DATA_DIR/.env" .env
    echo "Linked $DATA_DIR/.env to .env"
fi
