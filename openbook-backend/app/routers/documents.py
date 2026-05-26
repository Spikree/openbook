import os
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db
from app.models.schemas import Document, OpenBook
from app.services.pdf_service import extract_text, save_upload

router = APIRouter()


class DocumentResponse(BaseModel):
    id: str
    openbook_id: str
    name: str
    size: int
    uploaded_at: datetime

    class Config:
        from_attributes = True


@router.post("/{openbook_id}/upload", response_model=DocumentResponse)
async def upload_document(
    openbook_id: str, file: UploadFile = File(...), db: AsyncSession = Depends(get_db)
):
    # check openbook exists
    result = await db.execute(select(OpenBook).where(OpenBook.id == openbook_id))
    openbook = result.scalar_one_or_none()
    if not openbook:
        raise HTTPException(status_code=404, detail="OpenBook not found")

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    file_bytes = await file.read()
    file_id, file_path = save_upload(file_bytes, file.filename)

    content = extract_text(file_path)

    doc = Document(
        id=file_id,
        openbook_id=openbook_id,
        name=file.filename,
        size=len(file_bytes),
        content=content,
        file_path=file_path,
        uploaded_at=datetime.utcnow(),
    )

    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc


@router.get("/{openbook_id}")
async def get_documents(openbook_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Document).where(Document.openbook_id == openbook_id)
    )
    return result.scalars().all()


@router.get("/file/{document_id}")
async def get_document_file(document_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(
        doc.file_path,
        media_type="application/pdf",
        filename=doc.name,
        headers={"Content-Disposition": f"inline; filename={doc.name}"},
    )


@router.delete("/{document_id}")
async def delete_document(document_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    await db.delete(doc)
    await db.commit()
    return {"message": "Document deleted"}
