"""
Application settings using pydantic-settings.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""
    
    DATABASE_URL: str = "sqlite:///./data/michireader.db"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200
    CORS_ORIGINS: str = "http://localhost:5173"
    ENVIRONMENT: str = "development"
    
    model_config = SettingsConfigDict(env_file=".env")
    
    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


settings = Settings()
