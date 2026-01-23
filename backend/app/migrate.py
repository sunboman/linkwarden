"""
Database migration runner.
Tracks and applies SQL migrations in order.
"""
import logging
import sqlite3
from pathlib import Path

logger = logging.getLogger(__name__)

# Migrations directory at v2/ level (shared between backend and worker)
MIGRATIONS_DIR = Path(__file__).parent.parent.parent / "migrations"


def get_applied_migrations(conn: sqlite3.Connection) -> set[str]:
    """Get set of already applied migration names."""
    cursor = conn.cursor()
    
    # Create migrations tracking table if it doesn't exist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS _migrations (
            name TEXT PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    
    cursor.execute("SELECT name FROM _migrations")
    return {row[0] for row in cursor.fetchall()}


def get_pending_migrations(conn: sqlite3.Connection) -> list[Path]:
    """Get list of pending migrations sorted by name."""
    applied = get_applied_migrations(conn)
    
    if not MIGRATIONS_DIR.exists():
        logger.warning(f"Migrations directory not found: {MIGRATIONS_DIR}")
        return []
    
    all_migrations = sorted(MIGRATIONS_DIR.glob("*.sql"))
    pending = [m for m in all_migrations if m.name not in applied]
    
    return pending


def apply_migration(conn: sqlite3.Connection, migration_path: Path) -> bool:
    """Apply a single migration file."""
    logger.info(f"Applying migration: {migration_path.name}")
    
    try:
        sql = migration_path.read_text()
        cursor = conn.cursor()
        
        # Execute the migration SQL
        cursor.executescript(sql)
        
        # Record the migration as applied
        cursor.execute(
            "INSERT INTO _migrations (name) VALUES (?)",
            (migration_path.name,)
        )
        conn.commit()
        
        logger.info(f"Successfully applied: {migration_path.name}")
        return True
        
    except sqlite3.Error as e:
        logger.error(f"Failed to apply {migration_path.name}: {e}")
        conn.rollback()
        return False


def run_migrations(database_url: str) -> int:
    """
    Run all pending migrations.
    
    Args:
        database_url: SQLite database URL (sqlite:///path/to/db)
        
    Returns:
        Number of migrations applied
    """
    # Parse database path from URL
    if database_url.startswith("sqlite:///"):
        db_path = database_url[10:]
    else:
        db_path = database_url
    
    # Ensure database directory exists
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(db_path)
    
    try:
        pending = get_pending_migrations(conn)
        
        if not pending:
            logger.info("No pending migrations")
            return 0
        
        logger.info(f"Found {len(pending)} pending migration(s)")
        
        applied_count = 0
        for migration in pending:
            if apply_migration(conn, migration):
                applied_count += 1
            else:
                logger.error(f"Migration failed, stopping at {migration.name}")
                break
        
        return applied_count
    
    finally:
        conn.close()


def migrate_command():
    """CLI command to run migrations."""
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent))
    
    from app.settings import settings
    
    logging.basicConfig(level=logging.INFO)
    
    applied = run_migrations(settings.DATABASE_URL)
    logger.info(f"Applied {applied} migration(s)")


if __name__ == "__main__":
    migrate_command()
