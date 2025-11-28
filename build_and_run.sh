#!/bin/bash

# Defaults
BUILD=false
PORT=3031

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -b|--build) BUILD=true ;;
        -p|--port) PORT="$2"; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

export PORT=$PORT

if [ "$BUILD" = true ]; then
  echo "Building images..."
  docker compose build
fi

echo "Starting containers on port $PORT..."
docker compose up -d

echo "Done!"
