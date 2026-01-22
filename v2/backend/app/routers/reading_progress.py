"""
Router for reading progress.
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..database import get_session
from ..dependencies import get_current_user
from ..models import Link, ReadingProgress, User
from ..schemas import ReadingProgressResponse, ReadingProgressUpdate

router = APIRouter(prefix="/reading-progress", tags=["reading-progress"])


@router.get("/", response_model=ReadingProgressResponse)
async def get_reading_progress(
    linkId: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get reading progress for a link."""
    # Check if link exists
    link = session.get(Link, linkId)
    if not link:
         raise HTTPException(status_code=404, detail="Link not found")

    statement = select(ReadingProgress).where(
        ReadingProgress.user_id == current_user.id,
        ReadingProgress.link_id == linkId
    )
    progress = session.exec(statement).first()
    
    if not progress:
        return ReadingProgressResponse(percent=0.0, updated_at=datetime.utcnow())
        
    return progress


@router.put("/", response_model=ReadingProgressResponse)
async def update_reading_progress(
    progress_data: ReadingProgressUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Update reading progress for a link."""
    # Verify link exists
    link = session.get(Link, progress_data.link_id)
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
        
    # Check permission
    # In v2 currently just checking if user owns the link
    if link.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied")

    statement = select(ReadingProgress).where(
        ReadingProgress.user_id == current_user.id,
        ReadingProgress.link_id == progress_data.link_id
    )
    existing_progress = session.exec(statement).first()
    
    if existing_progress:
        existing_progress.percent = progress_data.percent
        existing_progress.text_quote = progress_data.text_quote
        existing_progress.text_position = progress_data.text_position
        existing_progress.css_selector = progress_data.css_selector
        existing_progress.updated_at = datetime.utcnow()
        session.add(existing_progress)
        session.commit()
        session.refresh(existing_progress)
        return existing_progress
    else:
        new_progress = ReadingProgress(
            user_id=current_user.id,
            link_id=progress_data.link_id,
            percent=progress_data.percent,
            text_quote=progress_data.text_quote,
            text_position=progress_data.text_position,
            css_selector=progress_data.css_selector
        )
        session.add(new_progress)
        session.commit()
        session.refresh(new_progress)
        return new_progress
