"""
Database configuration and connection management.
"""
from sqlmodel import Session, SQLModel, create_engine

from .settings import settings
from .migrate import run_migrations

# Create engine with SQLite
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},  # Needed for SQLite
    echo=False,  # Disable SQL logging
)


def create_db_and_tables():
    """Create database tables using migrations."""
    # Run SQL migrations first
    run_migrations(settings.DATABASE_URL)
    # Then let SQLModel create any missing tables/columns
    SQLModel.metadata.create_all(engine)


def get_session():
    """Dependency for getting database sessions."""
    with Session(engine) as session:
        yield session
