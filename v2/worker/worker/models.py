"""
Database models (shared with backend).
"""
from datetime import datetime
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel


# Link-Tag association table
class LinkTagLink(SQLModel, table=True):
    """Many-to-many relationship between links and tags."""
    
    __tablename__ = "link_tags"
    
    link_id: int = Field(foreign_key="links.id", primary_key=True)
    tag_id: int = Field(foreign_key="tags.id", primary_key=True)


class User(SQLModel, table=True):
    """User model."""
    
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    links: list["Link"] = Relationship(back_populates="user")


class Tag(SQLModel, table=True):
    """Tag model."""
    
    __tablename__ = "tags"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    links: list["Link"] = Relationship(back_populates="tags", link_model=LinkTagLink)


class Link(SQLModel, table=True):
    """Link model."""
    
    __tablename__ = "links"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    url: str = Field(index=True)
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None  # Archived readable content
    image_url: Optional[str] = None  # OG/metadata preview image
    screenshot_path: Optional[str] = None
    favicon_url: Optional[str] = None
    
    # Status: pending, archived, failed
    status: str = Field(default="pending", index=True)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    archived_at: Optional[datetime] = None
    
    # User relationship
    user_id: int = Field(foreign_key="users.id")
    user: User = Relationship(back_populates="links")
    
    # Tags relationship
    tags: list[Tag] = Relationship(back_populates="links", link_model=LinkTagLink)
    
    # Reading progress
    is_archived: bool = Field(default=False)
    reading_progress: float = Field(default=0.0)  # 0.0 to 1.0
