"""
Main FastAPI application.
"""
from contextlib import asynccontextmanager
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import create_db_and_tables
from .routers import auth, links, tags, reading_progress
from .settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events."""
    # Startup
    create_db_and_tables()
    yield
    # Shutdown
    pass


app = FastAPI(
    title="Michi Reader API",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(links.router, prefix="/api/v1")
app.include_router(tags.router, prefix="/api/v1")
app.include_router(reading_progress.router, prefix="/api/v1")

# Serve static files (screenshots)
# Serve static files (screenshots)
data_dir_str = os.getenv("DATA_DIR")
if data_dir_str:
    data_dir = Path(data_dir_str)
else:
    # Fallback for local development (relative to backend/app/main.py -> backend/ -> root/ -> data)
    data_dir = Path(__file__).parent.parent.parent / "data"

screenshots_dir = data_dir / "screenshots"
screenshots_dir.mkdir(parents=True, exist_ok=True)
app.mount("/api/v1/files", StaticFiles(directory=str(data_dir)), name="files")


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Michi Reader API", "status": "running"}


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}
