"""
Tag routes for listing available tags.
"""
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..database import get_session
from ..dependencies import get_current_user
from ..models import Tag, User


router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("")
async def list_tags(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
):
    """List all available tags."""
    statement = select(Tag).order_by(Tag.name)
    tags = session.exec(statement).all()
    return [{"id": t.id, "name": t.name} for t in tags]
