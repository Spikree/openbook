from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db
from app.models.schemas import OpenBook

router = APIRouter()


class CreateOpenBookRequest(BaseModel):
    name: str


class OpenBookResponse(BaseModel):
    id: str
    name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.post("/", response_model=OpenBookResponse)
async def create_openbook(
    body: CreateOpenBookRequest, db: AsyncSession = Depends(get_db)
):
    openbook = OpenBook(
        id=str(uuid4()),
        name=body.name,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(openbook)
    await db.commit()
    await db.refresh(openbook)
    return openbook


@router.get("/")
async def get_openbooks(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(OpenBook))
    return result.scalars().all()


@router.get("/{openbook_id}")
async def get_openbook(openbook_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(OpenBook).where(OpenBook.id == openbook_id))
    openbook = result.scalar_one_or_none()
    if not openbook:
        raise HTTPException(status_code=404, detail="OpenBook not found")
    return openbook


@router.delete("/{openbook_id}")
async def delete_openbook(openbook_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(OpenBook).where(OpenBook.id == openbook_id))
    openbook = result.scalar_one_or_none()
    if not openbook:
        raise HTTPException(status_code=404, detail="OpenBook not found")
    await db.delete(openbook)
    await db.commit()
    return {"message": "OpenBook deleted"}


@router.patch("/{openbook_id}")
async def update_openbook(
    openbook_id: str, body: CreateOpenBookRequest, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(OpenBook).where(OpenBook.id == openbook_id))
    openbook = result.scalar_one_or_none()
    if not openbook:
        raise HTTPException(status_code=404, detail="OpenBook not found")
    openbook.name = body.name
    openbook.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(openbook)
    return openbook
