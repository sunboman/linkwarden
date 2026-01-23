#!/bin/bash
set -e

# Michi Reader Environment Generator
# Usage: ./generate_env.sh [--prod] [TARGET_DIR]

MODE="dev"
TARGET_DIR=""

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --prod) MODE="prod" ;;
        *) 
            if [ -z "$TARGET_DIR" ]; then
                TARGET_DIR="$1"
            fi
            ;;
    esac
    shift
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_ENV="$ROOT_DIR/.env"

if [ "$MODE" == "prod" ]; then
    # In prod mode, we generate a single .env file in the target directory
    # If TARGET_DIR is not specified, default to . (current dir)
    [ -z "$TARGET_DIR" ] && TARGET_DIR="$ROOT_DIR"
    
    OUTPUT_FILE="$TARGET_DIR/.env"
    
    echo "=== Environment Generator (Production) ==="
    echo "Output: $OUTPUT_FILE"
    
    # Check if root env exists, otherwise we'll generate defaults
    if [ -f "$ROOT_ENV" ]; then
        set -a
        source "$ROOT_ENV"
        set +a
    fi

    # Generate production .env
    cat <<EOF > "$OUTPUT_FILE"
# Michi Reader Production Configuration
# Generated on $(date)

# Security
SECRET_KEY=${SECRET_KEY:-$(openssl rand -base64 32)}
ALGORITHM=${ALGORITHM:-HS256}
ACCESS_TOKEN_EXPIRE_MINUTES=${ACCESS_TOKEN_EXPIRE_MINUTES:-43200}

# Server
PORT=${PORT:-3032}
HOST=${HOST:-localhost}

# Data (Host Path)
DATA_DIR=${DATA_DIR:-./data}

# Database (Internal Docker Path)
DATABASE_URL=sqlite:////app/data/michireader.db

# CORS
CORS_ORIGINS=${CORS_ORIGINS:-http://localhost:3032}

# Worker Settings
POLL_INTERVAL=${POLL_INTERVAL:-5}
MAX_RETRIES=${MAX_RETRIES:-3}
TIMEOUT=${TIMEOUT:-30000}
SCREENSHOT_DIR=/app/data/screenshots
HEADLESS=true
ENVIRONMENT=production
EOF

    echo "Production .env generated at $OUTPUT_FILE"

else
    # Development Mode
    BACKEND_ENV="$ROOT_DIR/backend/.env"
    WORKER_ENV="$ROOT_DIR/worker/.env"

    echo "=== Environment Generator (Development) ==="

    if [ ! -f "$ROOT_ENV" ]; then
        if [ -f "$ROOT_DIR/.env.example" ]; then
            echo "Notice: Root .env not found. Creating from .env.example..."
            cp "$ROOT_DIR/.env.example" "$ROOT_ENV"
        else
            echo "Error: Root .env file not found at $ROOT_ENV and no .env.example found."
            exit 1
        fi
    fi

    set -a
    source "$ROOT_ENV"
    set +a

    echo "Generating backend/.env..."
    cat <<EOF > "$BACKEND_ENV"
# Generated from root .env configuration
DATABASE_URL=sqlite:///../data/michireader.db
SECRET_KEY=${SECRET_KEY}
ALGORITHM=${ALGORITHM:-HS256}
ACCESS_TOKEN_EXPIRE_MINUTES=${ACCESS_TOKEN_EXPIRE_MINUTES:-43200}
CORS_ORIGINS=${CORS_ORIGINS}
ENVIRONMENT=${ENVIRONMENT:-development}
EOF

    echo "Generating worker/.env..."
    cat <<EOF > "$WORKER_ENV"
# Generated from root .env configuration
DATABASE_URL=sqlite:///../data/michireader.db
POLL_INTERVAL=${POLL_INTERVAL:-5}
MAX_RETRIES=${MAX_RETRIES:-3}
SCREENSHOT_DIR=../data/screenshots
HEADLESS=${HEADLESS:-true}
TIMEOUT=${TIMEOUT:-30000}
ENVIRONMENT=${ENVIRONMENT:-development}
EOF

    echo "Done! Service environments updated."
fi
