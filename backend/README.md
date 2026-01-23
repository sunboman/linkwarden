# Michi Reader Backend

FastAPI backend for Michi Reader.

## Features

- **FastAPI**: Modern, fast web framework for building APIs
- **SQLModel**: SQLAlchemy + Pydantic for type-safe database models
- **SQLite**: Lightweight, file-based database with WAL mode
- **JWT Authentication**: Secure token-based authentication
- **CORS**: Configured for frontend integration

## Quick Start

### 1. Setup Environment

```bash
# From v2/backend directory
cp .env.example .env

# Edit .env and set SECRET_KEY
# Generate with: openssl rand -hex 32
```

### 2. Install Dependencies

```bash
# From v2 root
make dev-install
```

### 3. Run Development Server

```bash
# From v2 root
make run
```

The API will be available at `http://localhost:8000`.

- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Available Commands

```bash
make help         # Show all available commands
make sync         # Sync dependencies with uv
make install      # Install dependencies (alias for sync)
make dev-install  # Install dev dependencies
make run          # Run development server with uv
make test         # Run tests
make lint         # Run linter
make format       # Format code
make clean        # Clean cache files
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token
- `GET /api/v1/auth/me` - Get current user info

### Links

- `POST /api/v1/links` - Create a new link
- `GET /api/v1/links` - List links with pagination
- `GET /api/v1/links/{id}` - Get specific link
- `PUT /api/v1/links/{id}` - Update link
- `DELETE /api/v1/links/{id}` - Delete link

## Database

The SQLite database is stored at `../data/michireader.db` (shared with worker).

Schema:
- `users` - User accounts
- `links` - Saved links with metadata
- `tags` - Tags for organizing links
- `link_tags` - Many-to-many relationship

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI app
│   ├── database.py      # DB connection
│   ├── models.py        # SQLModel models
│   ├── schemas.py       # Pydantic schemas
│   ├── auth.py          # Auth utilities
│   ├── dependencies.py  # FastAPI dependencies
│   ├── settings.py      # Configuration
│   └── routers/
│       ├── auth.py      # Auth routes
│       └── links.py     # Link routes
├── Makefile
├── pyproject.toml
└── .env
```
