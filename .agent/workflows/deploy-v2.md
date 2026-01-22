---
description: Deploy Linkwarden v2 to production with Docker
---

# Deploy v2 to Production

This workflow deploys the Linkwarden v2 stack (frontend, backend, worker) as a production-ready Docker container with nginx reverse proxy.

## Prerequisites

- Docker and Docker Compose installed
- Port 3000 (or custom) available

## Quick Deploy

// turbo
1. Navigate to the v2 directory:
```bash
cd /Users/ugst/Code/linkwarden/v2
```

// turbo
2. Run the deploy script with build flag (first time or after code changes):
```bash
./deploy.sh --build
```

## Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | External port to expose |
| `DATA_DIR` | ~/.linkwarden-v2 | Host path for persistent data |
| `SECRET_KEY` | auto-generated | JWT secret key |
| `CORS_ORIGINS` | http://localhost:3000 | Allowed CORS origins |

### Deploy Script Options

```bash
./deploy.sh [options]

Options:
  -b, --build         Build/rebuild the Docker image
  -p, --port PORT     Set the external port (default: 3000)
  -d, --data-dir DIR  Set the data directory (default: ~/.linkwarden-v2)
```

## Examples

### Deploy on custom port with custom data directory:
```bash
./deploy.sh --build --port 8080 --data-dir /srv/linkwarden
```

### Redeploy without rebuilding:
```bash
./deploy.sh
```

## Viewing Logs

// turbo
```bash
docker compose -f docker-compose.prod.yml logs -f
```

## Stopping the Service

// turbo
```bash
docker compose -f docker-compose.prod.yml down
```

## Architecture

The production container includes:
- **nginx** (port 80): Reverse proxy and static file server
- **Backend** (port 8000 internal): FastAPI with Gunicorn + Uvicorn workers
- **Worker**: Background process for archiving links
- **Frontend**: Pre-built static files served by nginx

All services run in a single container managed by supervisord.

## Data Persistence

Data is stored in `$DATA_DIR` (default: `~/.linkwarden-v2`):
- `linkwarden.db` - SQLite database
- `screenshots/` - Archived screenshots
- `.env` - Environment configuration

## Updating

// turbo-all
1. Pull latest code:
```bash
git pull
```

2. Rebuild and redeploy:
```bash
./deploy.sh --build
```
