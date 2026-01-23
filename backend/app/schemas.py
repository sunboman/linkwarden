"""
Pydantic schemas for API requests and responses.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# Auth schemas
class UserCreate(BaseModel):
    """Schema for user registration."""
    username: str
    password: str
    email: Optional[str] = None


class UserLogin(BaseModel):
    """Schema for user login."""
    username: str
    password: str


class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    """Schema for user response."""
    id: int
    username: str
    email: Optional[str] = None
    created_at: datetime


# Link schemas
class LinkCreate(BaseModel):
    """Schema for creating a link."""
    url: str
    tags: Optional[list[str]] = None


class LinkUpdate(BaseModel):
    """Schema for updating a link."""
    title: Optional[str] = None
    description: Optional[str] = None
    is_archived: Optional[bool] = None
    reading_progress: Optional[float] = None
    content: Optional[str] = None
    tags: Optional[list[str]] = None


class TagResponse(BaseModel):
    """Schema for tag response."""
    id: int
    name: str

    class Config:
        from_attributes = True


class LinkResponse(BaseModel):
    """Schema for link response."""
    id: int
    url: str
    title: Optional[str]
    description: Optional[str]
    content: Optional[str]
    image_url: Optional[str]
    screenshot_path: Optional[str]
    favicon_url: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime
    archived_at: Optional[datetime]
    is_archived: bool
    reading_progress: float
    tags: list[TagResponse]
    
    class Config:
        from_attributes = True


class LinkListResponse(BaseModel):
    """Schema for paginated link list."""
    links: list[LinkResponse]
    total: int
    cursor: Optional[int] = None


# Reading Progress schemas
class ReadingProgressBase(BaseModel):
    """Base schema for reading progress."""
    percent: float
    text_quote: Optional[str] = None
    text_position: Optional[str] = None
    css_selector: Optional[str] = None


class ReadingProgressUpdate(ReadingProgressBase):
    """Schema for updating reading progress."""
    link_id: int


class ReadingProgressResponse(ReadingProgressBase):
    """Schema for reading progress response."""
    updated_at: datetime

