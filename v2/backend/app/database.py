"""
Database configuration and connection management.
"""
from sqlmodel import Session, SQLModel, create_engine

from .settings import settings

# Create engine with SQLite
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},  # Needed for SQLite
    echo=settings.ENVIRONMENT == "development",
)


def create_db_and_tables():
    """Create database tables."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Dependency for getting database sessions."""
    with Session(engine) as session:
        yield session
