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
export HOST=${HOST:-$(hostname)}

if [ "$BUILD" = true ]; then
  echo "Building images..."
  docker compose build --no-cache
fi

# Generate .env if missing
if [ ! -f .env ]; then
  echo "Generating .env file..."
  POSTGRES_PASSWORD=$(openssl rand -hex 16)
  NEXTAUTH_SECRET=$(openssl rand -base64 32)
  
  cat <<EOF > .env
NEXTAUTH_URL=http://localhost:$PORT/api/v1/auth
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
DATABASE_URL=postgresql://postgres:\${POSTGRES_PASSWORD}@postgres:5432/postgres
EOF
  echo ".env file generated."
else
  echo ".env file exists. Skipping generation."
fi

echo "Starting containers on port $PORT..."
docker compose up -d

echo "Done!"
