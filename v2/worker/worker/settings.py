"""
Settings configuration for the worker.
"""
import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Worker settings."""
    
    DATABASE_URL: str = "sqlite:///../data/linkwarden.db"
    POLL_INTERVAL: float = 0.5  # seconds
    MAX_RETRIES: int = 3
    SCREENSHOT_DIR: str = "../data/screenshots"
    HEADLESS: bool = True
    TIMEOUT: int = 30000
    ENVIRONMENT: str = "development"
    
    model_config = SettingsConfigDict(env_file=".env")
    
    @property
    def screenshot_path(self) -> Path:
        """Get absolute screenshot directory path."""
        path = Path(self.SCREENSHOT_DIR)
        if not path.is_absolute():
            # Resolve relative to worker directory
            path = (Path(__file__).parent.parent / self.SCREENSHOT_DIR).resolve()
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def preview_path(self) -> Path:
        """Get absolute preview directory path."""
        # Use same parent as screenshot dir but 'previews' folder
        path = self.screenshot_path.parent / "previews"
        path.mkdir(parents=True, exist_ok=True)
        return path


settings = Settings()
