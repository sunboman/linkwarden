#!/bin/bash
set -e
# Deploy script: stop old containers and start new ones

# Defaults
PORT=${PORT:-3031}
DATA_DIR="${DATA_DIR:-$HOME/.linkreader}"

export PORT=$PORT
export HOST=${HOST:-$(hostname)}
export DATA_DIR=$DATA_DIR

# Ensure data directory exists
mkdir -p "$DATA_DIR/data" "$DATA_DIR/pgdata"

# Generate .env if missing
if [ ! -f "$DATA_DIR/.env" ]; then
  echo "Generating .env file in $DATA_DIR..."
  POSTGRES_PASSWORD=$(openssl rand -hex 16)
  NEXTAUTH_SECRET=$(openssl rand -base64 32)
  
  cat <<EOF > "$DATA_DIR/.env"
NEXTAUTH_URL=http://localhost:$PORT/api/v1/auth
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
DATABASE_URL=postgresql://postgres:\${POSTGRES_PASSWORD}@postgres:5432/postgres
EOF
  echo ".env file generated."
else
  echo ".env file exists at $DATA_DIR/.env. Skipping generation."
fi

# Copy .env to current directory for docker-compose
cp "$DATA_DIR/.env" .env

echo "Stopping old containers..."
docker compose down --remove-orphans || true

echo "Starting containers on port $PORT..."
docker compose up -d

echo "Done! Data stored in $DATA_DIR"
