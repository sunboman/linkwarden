"""
Content archiver using Playwright and Mozilla Readability.
Uses the official @mozilla/readability library for best content extraction.
Mirrors v1 worker configuration for maximum compatibility.
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
try:
    READABILITY_JS = (SCRIPTS_DIR / "Readability.min.js").read_text()
except FileNotFoundError:
    logger.warning("Readability.min.js not found. Run 'make worker-install' to download it.")
    READABILITY_JS = ""


class Archiver:
    """Archive web content using Playwright and Mozilla Readability."""
    
    def __init__(self):
        """Initialize the archiver."""
        self.playwright = None
        self.browser = None
    
    def start(self):
        """Start the browser."""
        logger.info("Starting browser...")
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(headless=settings.HEADLESS)
        logger.info("Browser started")
    
    def stop(self):
        """Stop the browser."""
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
        logger.info("Browser stopped")
    
    def _create_context(self):
        """Create a new browser context with v1-compatible settings."""
        # Use Desktop Chrome device emulation (same as v1)
        return self.browser.new_context(
            # Desktop Chrome device settings
            viewport={"width": 1280, "height": 720},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            # Ignore HTTPS errors (same as v1)
            ignore_https_errors=True,
            # Accept all content types
            extra_http_headers={
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "DNT": "1",
                "Upgrade-Insecure-Requests": "1",
            },
        )
    
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
        
        # Validate URL
        if not url or not (url.startswith("http://") or url.startswith("https://")):
            logger.warning(f"Invalid URL: {url}")
            return {
                "status": "failed",
                "error": "Invalid URL",
            }
        
        context = None
        page = None
        
        try:
            # Create fresh context for each request (same as v1)
            context = self._create_context()
            page = context.new_page()
            
            # Navigate to URL with domcontentloaded (faster than networkidle, same as v1)
            page.goto(url, timeout=settings.TIMEOUT, wait_until="domcontentloaded")
            
            # Wait a bit for dynamic content to load
            page.wait_for_timeout(1000)
            
            # Get favicon
            favicon_url = self._extract_favicon(page)
            
            # Get OG/metadata image (and download it)
            image_url = self._extract_and_download_og_image(page, link_id)
            
            # Get page title as fallback
            page_title = page.title()
            
            # Get meta description as fallback
            meta_description = self._extract_meta_description(page)
            
            # Take screenshot (for fallback)
            screenshot_path = self._take_screenshot(page, link_id)
            
            # Extract readable content using Mozilla Readability in browser
            readable_result = self._extract_readable_content(page, url)
            
            if not readable_result:
                logger.warning(f"No readable content found for: {url}")
                # Still return partial success with metadata
                return {
                    "title": page_title or url,
                    "description": meta_description,
                    "content": None,
                    "image_url": image_url,
                    "screenshot_path": screenshot_path,
                    "favicon_url": favicon_url,
                    "status": "completed",
                    "archived_at": datetime.utcnow(),
                }
            
            logger.info(f"Successfully archived: {url}")
            
            return {
                "title": readable_result.get("title") or page_title,
                "content": readable_result.get("content"),
                "description": readable_result.get("excerpt") or meta_description,
                "image_url": image_url,
                "screenshot_path": screenshot_path,
                "favicon_url": favicon_url,
                "status": "completed",
                "archived_at": datetime.utcnow(),
            }
            
        except Exception as e:
            logger.error(f"Failed to archive {url}: {e}")
            return {
                "status": "failed",
                "error": str(e),
            }
        finally:
            # Clean up (same as v1 - close context after each request)
            if page:
                try:
                    page.close()
                except:
                    pass
            if context:
                try:
                    context.close()
                except:
                    pass
    
    def _extract_readable_content(self, page, url: str) -> Optional[dict]:
        """
        Extract readable content using Mozilla Readability inside browser.
        
        Returns dictionary with: title, content, excerpt, byline, length, etc.
        """
        if not READABILITY_JS:
            logger.error("Readability.js not loaded")
            return None
            
        try:
            # Inject and run Readability.js in the browser context
            result = page.evaluate(f"""
                (url) => {{
                    // Inject Readability library
                    {READABILITY_JS}
                    
                    // Clone document to avoid modifying the original
                    const documentClone = document.cloneNode(true);
                    
                    // Create Readability instance and parse
                    const reader = new Readability(documentClone, {{
                        // Options to improve extraction
                        charThreshold: 20,
                        keepClasses: false,
                    }});
                    const article = reader.parse();
                    
                    if (!article) return null;
                    
                    // Return structured data
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
            """, url)
            
            return result
            
        except Exception as e:
            logger.error(f"Readability extraction failed: {e}")
            return None
    
    def _extract_meta_description(self, page) -> Optional[str]:
        """Extract meta description from page."""
        try:
            result = page.evaluate("""
                () => {
                    const description = document.querySelector('meta[name="description"]');
                    return description?.getAttribute('content') ?? null;
                }
            """)
            return result
        except Exception as e:
            logger.debug(f"Could not extract meta description: {e}")
            return None
    
    def _extract_favicon(self, page) -> Optional[str]:
        """Extract favicon URL from page."""
        try:
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
    
    def _extract_and_download_og_image(self, page, link_id: int) -> Optional[str]:
        """Extract Open Graph image and download it locally."""
        try:
            # 1. Extract URL
            image_url = page.evaluate("""
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
            
            if not image_url:
                return None
                
            # Handle relative URLs
            if not image_url.startswith('http'):
                base_url = page.evaluate("document.baseURI || window.location.origin")
                from urllib.parse import urljoin
                image_url = urljoin(base_url, image_url)
                
            logger.info(f"Found OG image: {image_url}")
            
            # 2. Download content using the page context (cookies/auth)
            # Use a separate page/request to avoid navigating away
            response = page.request.get(image_url, timeout=5000)
            if not response.ok:
                logger.warning(f"Failed to download OG image: {response.status} {response.status_text}")
                return None
                
            data = response.body()
            
            # 3. Save to disk
            preview_dir = settings.preview_path
            # Determine extension
            content_type = response.headers.get("content-type", "")
            ext = ".jpg"
            if "png" in content_type:
                ext = ".png"
            elif "webp" in content_type:
                ext = ".webp"
                
            filename = f"preview_{link_id}_{datetime.utcnow().timestamp():.0f}{ext}"
            filepath = preview_dir / filename
            
            filepath.write_bytes(data)
            
            return f"previews/{filename}"
            
        except Exception as e:
            logger.debug(f"Could not extract/download OG image: {e}")
        
        return None
    
    def _take_screenshot(self, page, link_id: int) -> str:
        """Take a screenshot and return the relative path."""
        screenshot_dir = settings.screenshot_path
        filename = f"link_{link_id}_{datetime.utcnow().timestamp():.0f}.png"
        filepath = screenshot_dir / filename
        
        try:
            # Limit screenshot height to avoid huge files
            page.screenshot(path=str(filepath), full_page=False)
        except Exception as e:
            logger.warning(f"Screenshot failed: {e}")
            return ""
        
        # Return relative path from data directory
        return f"screenshots/{filename}"
