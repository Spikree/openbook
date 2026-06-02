from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db
from app.models.schemas import Note, OpenBook

router = APIRouter()


class NoteCreate(BaseModel):
    openbook_id: str
    title: str


class NoteUpdate(BaseModel):
    title: str | None = None
    content: str | None = None


class NoteResponse(BaseModel):
    id: str
    openbook_id: str
    title: str
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.post("/", response_model=NoteResponse)
async def create_note(body: NoteCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(OpenBook).where(OpenBook.id == body.openbook_id))
    openbook = result.scalar_one_or_none()
    if not openbook:
        raise HTTPException(status_code=404, detail="OpenBook not found")

    note = Note(
        id=str(uuid4()),
        openbook_id=body.openbook_id,
        title=body.title,
        content="",
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note


@router.get("/{openbook_id}")
async def get_notes(openbook_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Note)
        .where(Note.openbook_id == openbook_id)
        .order_by(Note.updated_at.desc())
    )
    return result.scalars().all()


@router.patch("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: str, body: NoteUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    if body.title is not None:
        note.title = body.title
    if body.content is not None:
        note.content = body.content

    await db.commit()
    await db.refresh(note)
    return note


@router.delete("/{note_id}")
async def delete_note(note_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    await db.delete(note)
    await db.commit()
    return {"message": "Note deleted"}


@router.get("/{note_id}/download")
async def download_note(note_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    content = f"# {note.title}\n\n{note.content}"
    filename = f"{note.title.replace(' ', '_')}.md"

    return Response(
        content=content,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
