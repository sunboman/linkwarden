"""
Main worker process for polling and archiving links.
"""
import logging
import signal
import sys
import time
from datetime import datetime

from sqlmodel import Session, select

from .archiver import Archiver
from .database import engine
from .models import Link
from .settings import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Global flag for graceful shutdown
shutdown_flag = False


def signal_handler(sig, frame):
    """Handle shutdown signals."""
    global shutdown_flag
    logger.info("Shutdown signal received, finishing current job...")
    shutdown_flag = True


def main():
    """Main worker loop."""
    global shutdown_flag
    
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    logger.info("Worker starting...")
    logger.info(f"Poll interval: {settings.POLL_INTERVAL}s")
    logger.info(f"Database: {settings.DATABASE_URL}")
    
    # Start archiver
    archiver = Archiver()
    archiver.start()
    
    try:
        while not shutdown_flag:
            try:
                # Process pending links
                processed = process_pending_links(archiver)
                
                if processed == 0:
                    # No pending links, wait before next poll
                    logger.debug(f"No pending links, sleeping for {settings.POLL_INTERVAL}s")
                    time.sleep(settings.POLL_INTERVAL)
                else:
                    # Processed some links, check immediately for more
                    logger.info(f"Processed {processed} link(s), checking for more...")
                    
            except Exception as e:
                logger.error(f"Error in worker loop: {e}", exc_info=True)
                time.sleep(settings.POLL_INTERVAL)
    
    finally:
        logger.info("Shutting down worker...")
        archiver.stop()
        logger.info("Worker stopped")


def process_pending_links(archiver: Archiver) -> int:
    """
    Process all pending links.
    
    Returns:
        Number of links processed
    """
    with Session(engine) as session:
        # Get pending links
        statement = select(Link).where(Link.status == "pending").limit(10)
        pending_links = session.exec(statement).all()
        
        if not pending_links:
            return 0
        
        logger.info(f"Found {len(pending_links)} pending link(s)")
        
        for link in pending_links:
            try:
                logger.info(f"Processing link {link.id}: {link.url}")
                
                # Archive the link
                result = archiver.archive_url(link.url, link.id)
                
                # Update link with results
                link.status = result.get("status", "failed")
                link.updated_at = datetime.utcnow()
                
                if result.get("status") == "completed":
                    link.title = result.get("title") or link.title
                    link.description = result.get("description")
                    link.content = result.get("content")
                    link.image_url = result.get("image_url")
                    link.screenshot_path = result.get("screenshot_path")
                    link.favicon_url = result.get("favicon_url")
                    link.archived_at = result.get("archived_at")
                    logger.info(f"Successfully archived link {link.id}")
                else:
                    logger.error(f"Failed to archive link {link.id}: {result.get('error')}")
                
                session.add(link)
                session.commit()
                
            except Exception as e:
                logger.error(f"Error processing link {link.id}: {e}", exc_info=True)
                link.status = "failed"
                link.updated_at = datetime.utcnow()
                session.add(link)
                session.commit()
        
        return len(pending_links)


if __name__ == "__main__":
    main()
