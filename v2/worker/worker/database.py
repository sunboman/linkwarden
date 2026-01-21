"""
Database connection and session management.
"""
from sqlmodel import Session, create_engine

from .settings import settings

# Create engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=settings.ENVIRONMENT == "development",
)


def get_session():
    """Get a database session."""
    with Session(engine) as session:
        yield session
