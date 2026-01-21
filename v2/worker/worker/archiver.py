"""
Content archiver using Playwright and Readability.
"""
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

from playwright.sync_api import sync_playwright
from readability import Document

from .settings import settings

logger = logging.getLogger(__name__)


class Archiver:
    """Archive web content using Playwright."""
    
    def __init__(self):
        """Initialize the archiver."""
        self.playwright = None
        self.browser = None
        self.context = None
    
    def start(self):
        """Start the browser."""
        logger.info("Starting browser...")
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(headless=settings.HEADLESS)
        self.context = self.browser.new_context(
            viewport={"width": 1280, "height": 720},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        )
        logger.info("Browser started")
    
    def stop(self):
        """Stop the browser."""
        if self.context:
            self.context.close()
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
        logger.info("Browser stopped")
    
    def archive_url(self, url: str, link_id: int) -> dict:
        """
        Archive a URL and return extracted content.
        
        Args:
            url: URL to archive
            link_id: Database link ID for screenshot naming
            
        Returns:
            Dictionary with extracted data (title, content, screenshot_path, etc.)
        """
        logger.info(f"Archiving URL: {url}")
        
        try:
            page = self.context.new_page()
            
            # Navigate to URL
            page.goto(url, timeout=settings.TIMEOUT, wait_until="networkidle")
            
            # Get page HTML
            html_content = page.content()
            
            # Get page title
            title = page.title()
            
            # Get favicon
            favicon_url = self._extract_favicon(page)
            
            # Get OG/metadata image
            image_url = self._extract_og_image(page)
            
            # Take screenshot (for fallback)
            screenshot_path = self._take_screenshot(page, link_id)
            
            # Close page
            page.close()
            
            # Extract readable content using Readability
            doc = Document(html_content)
            readable_content = doc.summary()
            readable_title = doc.title()
            
            # Use readability title if page title is empty
            final_title = title if title else readable_title
            
            logger.info(f"Successfully archived: {url}")
            
            return {
                "title": final_title,
                "content": readable_content,
                "image_url": image_url,
                "screenshot_path": screenshot_path,
                "favicon_url": favicon_url,
                "status": "archived",
                "archived_at": datetime.utcnow(),
            }
            
        except Exception as e:
            logger.error(f"Failed to archive {url}: {e}")
            return {
                "status": "failed",
                "error": str(e),
            }
    
    def _extract_favicon(self, page) -> Optional[str]:
        """Extract favicon URL from page."""
        try:
            # Try to find favicon link
            favicon = page.locator('link[rel*="icon"]').first
            if favicon.count() > 0:
                href = favicon.get_attribute("href")
                if href:
                    # Make absolute URL
                    if href.startswith("http"):
                        return href
                    else:
                        return page.url.rstrip("/") + "/" + href.lstrip("/")
        except Exception as e:
            logger.debug(f"Could not extract favicon: {e}")
        
        return None
    
    def _extract_og_image(self, page) -> Optional[str]:
        """Extract Open Graph or meta image from page."""
        try:
            # Try og:image first
            og_image = page.locator('meta[property="og:image"]').first
            if og_image.count() > 0:
                content = og_image.get_attribute("content")
                if content:
                    return content
            
            # Try twitter:image
            twitter_image = page.locator('meta[name="twitter:image"]').first
            if twitter_image.count() > 0:
                content = twitter_image.get_attribute("content")
                if content:
                    return content
            
            # Try generic meta image
            meta_image = page.locator('meta[name="image"]').first
            if meta_image.count() > 0:
                content = meta_image.get_attribute("content")
                if content:
                    return content
        except Exception as e:
            logger.debug(f"Could not extract OG image: {e}")
        
        return None
    
    def _take_screenshot(self, page, link_id: int) -> str:
        """Take a screenshot and return the relative path."""
        screenshot_dir = settings.screenshot_path
        filename = f"link_{link_id}_{datetime.utcnow().timestamp():.0f}.png"
        filepath = screenshot_dir / filename
        
        page.screenshot(path=str(filepath), full_page=True)
        
        # Return relative path from data directory
        return f"screenshots/{filename}"
