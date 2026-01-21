"""
Content archiver using Playwright and Mozilla Readability.
Uses the official @mozilla/readability library for best content extraction.
"""
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

from playwright.sync_api import sync_playwright

from .settings import settings

logger = logging.getLogger(__name__)

# Load Readability.js script
SCRIPTS_DIR = Path(__file__).parent / "scripts"
READABILITY_JS = (SCRIPTS_DIR / "Readability.min.js").read_text()


class Archiver:
    """Archive web content using Playwright and Mozilla Readability."""
    
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
            
            # Get favicon
            favicon_url = self._extract_favicon(page)
            
            # Get OG/metadata image
            image_url = self._extract_og_image(page)
            
            # Take screenshot (for fallback)
            screenshot_path = self._take_screenshot(page, link_id)
            
            # Extract readable content using Mozilla Readability in browser
            readable_result = self._extract_readable_content(page)
            
            # Close page
            page.close()
            
            if not readable_result:
                logger.warning(f"No readable content found for: {url}")
                return {
                    "status": "failed",
                    "error": "No readable content extracted",
                }
            
            logger.info(f"Successfully archived: {url}")
            
            return {
                "title": readable_result.get("title"),
                "content": readable_result.get("content"),
                "description": readable_result.get("excerpt"),
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
    
    def _extract_readable_content(self, page) -> Optional[dict]:
        """
        Extract readable content using Mozilla Readability inside browser.
        
        Returns dictionary with: title, content, excerpt, byline, length, etc.
        """
        try:
            # Inject and run Readability.js in the browser context
            result = page.evaluate(f"""
                () => {{
                    // Inject Readability library
                    {READABILITY_JS}
                    
                    // Clone document to avoid modifying the original
                    const documentClone = document.cloneNode(true);
                    
                    // Create Readability instance and parse
                    const reader = new Readability(documentClone);
                    const article = reader.parse();
                    
                    if (!article) return null;
                    
                    return {{
                        title: article.title,
                        content: article.content,
                        textContent: article.textContent,
                        excerpt: article.excerpt,
                        byline: article.byline,
                        siteName: article.siteName,
                        length: article.length,
                        lang: article.lang,
                        dir: article.dir,
                        publishedTime: article.publishedTime
                    }};
                }}
            """)
            
            return result
            
        except Exception as e:
            logger.error(f"Readability extraction failed: {e}")
            return None
    
    def _extract_favicon(self, page) -> Optional[str]:
        """Extract favicon URL from page."""
        try:
            # Try to find favicon link
            result = page.evaluate("""
                () => {
                    const icons = document.querySelectorAll('link[rel*="icon"]');
                    for (const icon of icons) {
                        const href = icon.getAttribute('href');
                        if (href) {
                            if (href.startsWith('http')) return href;
                            // Make absolute URL
                            const base = document.baseURI || window.location.origin;
                            return new URL(href, base).href;
                        }
                    }
                    // Fallback to /favicon.ico
                    return window.location.origin + '/favicon.ico';
                }
            """)
            return result
        except Exception as e:
            logger.debug(f"Could not extract favicon: {e}")
        
        return None
    
    def _extract_og_image(self, page) -> Optional[str]:
        """Extract Open Graph or meta image from page."""
        try:
            result = page.evaluate("""
                () => {
                    // Try og:image first
                    const ogImage = document.querySelector('meta[property="og:image"]');
                    if (ogImage) {
                        const content = ogImage.getAttribute('content');
                        if (content) return content;
                    }
                    
                    // Try twitter:image
                    const twitterImage = document.querySelector('meta[name="twitter:image"]');
                    if (twitterImage) {
                        const content = twitterImage.getAttribute('content');
                        if (content) return content;
                    }
                    
                    // Try generic meta image
                    const metaImage = document.querySelector('meta[name="image"]');
                    if (metaImage) {
                        const content = metaImage.getAttribute('content');
                        if (content) return content;
                    }
                    
                    return null;
                }
            """)
            return result
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
