"""
Link routes for CRUD operations.
"""
from datetime import datetime
from enum import IntEnum
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import selectinload
from sqlmodel import Session, and_, or_, select

from ..database import get_session, commit_and_refresh
from ..dependencies import get_current_user
from ..models import Link, LinkTagLink, Tag, User, ReadingProgress
from ..schemas import LinkCreate, LinkListResponse, LinkResponse, LinkUpdate, TagResponse


class Sort(IntEnum):
    """Sort options matching v1 behavior."""
    DateNewestFirst = 0
    DateOldestFirst = 1
    LastReadNewestFirst = 2
    LastReadOldestFirst = 3


router = APIRouter(prefix="/links", tags=["links"])


def enrich_link(link: Link, user_id: int) -> LinkResponse:
    """Attach reading progress to link."""
    progress = 0.0
    for p in link.reading_progress_records:
        if p.user_id == user_id:
            progress = p.percent
            break
            
    # Manually construct LinkResponse to handle reading_progress injection
    tags = [TagResponse.model_validate(t) for t in link.tags]
    
    return LinkResponse(
        **link.model_dump(),
        tags=tags,
        reading_progress=progress
    )





@router.post("", response_model=LinkResponse, status_code=status.HTTP_201_CREATED)
async def create_link(
    link_data: LinkCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
):
    """Create a new link (add to read later queue)."""
    # Create link
    link = Link(
        url=link_data.url,
        user_id=current_user.id,
        status="pending",
    )
    
    # Handle tags
    if link_data.tags:
        for tag_name in link_data.tags:
            # Get or create tag
            statement = select(Tag).where(Tag.name == tag_name)
            tag = session.exec(statement).first()
            if not tag:
                tag = Tag(name=tag_name)
                session.add(tag)
                session.flush()
            
            link.tags.append(tag)
    
    commit_and_refresh(session, link)
    commit_and_refresh(session, link)
    return enrich_link(link, current_user.id)


@router.get("", response_model=LinkListResponse)
async def list_links(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
    cursor: int = Query(0, description="Pagination cursor (offset)"),
    limit: int = Query(50, le=100, description="Number of items to return"),
    archived: Optional[bool] = Query(None, description="Filter by archived status"),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    tag: Optional[str] = Query(None, description="Filter by tag name"),
    sort: int = Query(Sort.DateNewestFirst.value, description="Sort order: 0=Date Newest, 1=Date Oldest, 2=Last Read Newest, 3=Last Read Oldest"),
):
    """List links with pagination."""
    # Build query
    statement = select(Link).where(Link.user_id == current_user.id)
    
    if archived is not None:
        statement = statement.where(Link.is_archived == archived)
    
    if status_filter:
        statement = statement.where(Link.status == status_filter)
    
    if tag:
        statement = statement.join(Link.tags).where(Tag.name == tag)
    
    # Apply DB-level sorting for date-based sorts
    # Last Read sorting is done in application layer (matching v1 behavior)
    if sort == Sort.DateNewestFirst:
        statement = statement.order_by(Link.created_at.desc())
    elif sort == Sort.DateOldestFirst:
        statement = statement.order_by(Link.created_at.asc())
    else:
        # Default order for Last Read sorting (will be re-sorted in app layer)
        statement = statement.order_by(Link.created_at.desc())
    
    # Get total count
    count_statement = select(Link).where(Link.user_id == current_user.id)
    if archived is not None:
        count_statement = count_statement.where(Link.is_archived == archived)
    if status_filter:
        count_statement = count_statement.where(Link.status == status_filter)
    if tag:
        count_statement = count_statement.join(Link.tags).where(Tag.name == tag)
    
    total = len(session.exec(count_statement).all())
    
    # For Last Read sorting, we need to fetch all links and sort in app layer
    # (matching v1 behavior - Prisma doesn't support ORDER BY on related aggregates)
    if sort in (Sort.LastReadNewestFirst, Sort.LastReadOldestFirst):
        # Fetch all links (no pagination yet)
        statement_all = statement.options(selectinload(Link.reading_progress_records))
        all_links = list(session.exec(statement_all).all())
        
        # Sort by last read time (or created_at if not read)
        def get_sort_time(link: Link) -> datetime:
            """Get sorting timestamp: reading progress updated_at if exists, else created_at."""
            for p in link.reading_progress_records:
                if p.user_id == current_user.id:
                    return p.updated_at
            return link.created_at
        
        reverse = sort == Sort.LastReadNewestFirst
        all_links.sort(key=get_sort_time, reverse=reverse)
        
        # Apply pagination
        links = all_links[cursor:cursor + limit]
    else:
        # Apply pagination at DB level
        statement = statement.offset(cursor).limit(limit)
        # Eager load reading progress
        statement = statement.options(selectinload(Link.reading_progress_records))
        links = session.exec(statement).all()
    
    # Enrich links
    links = [enrich_link(link, current_user.id) for link in links]
    
    next_cursor = cursor + limit if cursor + limit < total else None
    
    return {
        "links": links,
        "total": total,
        "cursor": next_cursor,
    }


@router.get("/{link_id}", response_model=LinkResponse)
async def get_link(
    link_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
):
    """Get a specific link."""
    statement = select(Link).where(
        and_(Link.id == link_id, Link.user_id == current_user.id)
    ).options(selectinload(Link.reading_progress_records))
    link = session.exec(statement).first()
    
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link not found",
        )
    
    return enrich_link(link, current_user.id)


@router.put("/{link_id}", response_model=LinkResponse)
async def update_link(
    link_id: int,
    link_data: LinkUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
):
    """Update a link."""
    statement = select(Link).where(
        and_(Link.id == link_id, Link.user_id == current_user.id)
    ).options(selectinload(Link.reading_progress_records))
    link = session.exec(statement).first()
    
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link not found",
        )
    
    # Update fields
    update_data = link_data.model_dump(exclude_unset=True)
    
    # Handle tags separately
    if "tags" in update_data:
        tag_names = update_data.pop("tags")
        link.tags.clear()
        for tag_name in tag_names:
            statement = select(Tag).where(Tag.name == tag_name)
            tag = session.exec(statement).first()
            if not tag:
                tag = Tag(name=tag_name)
                session.add(tag)
                session.flush()
            link.tags.append(tag)
    
    for key, value in update_data.items():
        setattr(link, key, value)
    
    link.updated_at = datetime.utcnow()
    
    commit_and_refresh(session, link)
    
    return enrich_link(link, current_user.id)


@router.delete("/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_link(
    link_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
):
    """Delete a link."""
    statement = select(Link).where(
        and_(Link.id == link_id, Link.user_id == current_user.id)
    )
    link = session.exec(statement).first()
    
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link not found",
        )
    
    # Delete associated files
    from pathlib import Path
    
    # Resolve data directory (same as in main.py)
    # v2/backend/app/routers/links.py -> v2/data
    data_dir = Path(__file__).parent.parent.parent.parent / "data"
    
    files_to_delete = []
    
    # Add screenshot
    if link.screenshot_path:
        files_to_delete.append(data_dir / link.screenshot_path)
    
    # Add preview image if it's a local file
    if link.image_url and not link.image_url.startswith("http"):
        files_to_delete.append(data_dir / link.image_url)
    
    # Add readable content file if it's stored as a file path (for v1 compatibility)
    # Although v2 stores it in DB, let's be safe if it points to a file
    if link.content and link.content.startswith("archives/"):
        files_to_delete.append(data_dir / link.content)

    for file_path in files_to_delete:
        try:
            if file_path.exists() and file_path.is_file():
                file_path.unlink()
        except Exception as e:
            # Log error but don't fail deletion
            print(f"Failed to delete file {file_path}: {e}")
            pass
    
    session.delete(link)
    session.commit()
    
    return None


@router.post("/{link_id}/refresh", response_model=LinkResponse)
async def refresh_link(
    link_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
):
    """Re-queue a link for archiving (clears existing archive data)."""
    statement = select(Link).where(
        and_(Link.id == link_id, Link.user_id == current_user.id)
    ).options(selectinload(Link.reading_progress_records))
    link = session.exec(statement).first()
    
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link not found",
        )
    
    # Delete associated files (prevent orphans)
    from pathlib import Path
    data_dir = Path(__file__).parent.parent.parent.parent / "data"
    
    files_to_delete = []
    if link.screenshot_path:
        files_to_delete.append(data_dir / link.screenshot_path)
    if link.image_url and not link.image_url.startswith("http"):
        files_to_delete.append(data_dir / link.image_url)
    if link.content and link.content.startswith("archives/"):
        files_to_delete.append(data_dir / link.content)

    for file_path in files_to_delete:
        try:
            if file_path.exists() and file_path.is_file():
                file_path.unlink()
        except Exception:
            pass

    # Reset archive data
    link.content = None
    link.screenshot_path = None
    link.image_url = None
    link.archived_at = None
    link.status = "pending"
    link.updated_at = datetime.utcnow()
    
    commit_and_refresh(session, link)
    
    return enrich_link(link, current_user.id)
