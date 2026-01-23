# Linkwarden Worker v2

Background worker for archiving links using Playwright and Readability.

## Features

- **Playwright**: Headless browser for fetching web content
- **Readability**: Extract clean, readable content from HTML
- **Screenshot Capture**: Full-page screenshots saved for each link
- **Queue Polling**: Checks SQLite database for pending links
- **Graceful Shutdown**: Handles SIGINT/SIGTERM signals
- **Shared Database**: Uses same SQLite database as backend

## Quick Start

### 1. Setup Environment

```bash
# From v2/worker directory
cp .env.example .env
```

### 2. Install Dependencies

```bash
# From v2 root
make worker-dev-install

# Install Playwright browsers
cd worker && uv run playwright install chromium
```

### 3. Run Worker

```bash
# From v2 root
make worker-run
```

## How It Works

1. **Polls Database**: Every 5 seconds (configurable), checks for links where `status='pending'`
2. **Archives Content**:
   - Opens URL in Playwright
   - Extracts page title and favicon
   - Takes full-page screenshot
   - Extracts clean content using Readability
3. **Updates Database**: Sets `status='archived'` or `status='failed'`

## Configuration

Edit `.env` file:

```bash
DATABASE_URL=sqlite:///../data/linkwarden.db
POLL_INTERVAL=5          # Seconds between polls
MAX_RETRIES=3            # Not yet implemented
SCREENSHOT_DIR=../data/screenshots
HEADLESS=true            # Run browser in headless mode
TIMEOUT=30000            # Page load timeout (ms)
```

## Project Structure

```
worker/
├── worker/
│   ├── __init__.py
│   ├── main.py          # Main worker loop
│   ├── archiver.py      # Playwright archiving logic
│   ├── database.py      # DB connection
│   ├── models.py        # SQLModel models
│   └── settings.py      # Configuration
├── pyproject.toml
└── .env
```

## Architecture

```
┌─────────────┐
│   Frontend  │
│     (PWA)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Backend   │
│  (FastAPI)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐         ┌──────────────┐
│   SQLite    │◄────────│    Worker    │
│  (Queue)    │         │  (Playwright)│
└─────────────┘         └──────────────┘
```

## Logs

Worker produces structured logs:

```
2026-01-20 17:00:00 - worker.main - INFO - Worker starting...
2026-01-20 17:00:01 - worker.archiver - INFO - Starting browser...
2026-01-20 17:00:02 - worker.main - INFO - Found 1 pending link(s)
2026-01-20 17:00:02 - worker.archiver - INFO - Archiving URL: https://example.com
2026-01-20 17:00:05 - worker.archiver - INFO - Successfully archived: https://example.com
2026-01-20 17:00:05 - worker.main - INFO - Successfully archived link 1
```
