import json
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db
from app.models.schemas import Document, Flashcard, Message, Summary
from app.services.ollama_service import generate, stream_chat

router = APIRouter()


class ChatRequest(BaseModel):
    openbook_id: str
    message: str
    selected_document_ids: list[str]
    conversation_history: list[dict]


class GenerateRequest(BaseModel):
    openbook_id: str
    selected_document_ids: list[str]


async def get_context(document_ids: list[str], db: AsyncSession) -> str:
    if not document_ids:
        return ""
    result = await db.execute(select(Document).where(Document.id.in_(document_ids)))
    docs = result.scalars().all()
    context = ""
    for doc in docs:
        context += f"\n--- {doc.name} ---\n{doc.content}\n"
    return context.strip()


@router.post("/chat")
async def chat(body: ChatRequest, db: AsyncSession = Depends(get_db)):
    context = await get_context(body.selected_document_ids, db)

    messages = [*body.conversation_history, {"role": "user", "content": body.message}]

    async def event_stream():
        full_response = ""
        async for chunk in stream_chat(messages, context):
            full_response += chunk
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        yield f"data: {json.dumps({'done': True, 'full': full_response})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/summarise")
async def summarise(body: GenerateRequest, db: AsyncSession = Depends(get_db)):
    context = await get_context(body.selected_document_ids, db)
    if not context:
        raise HTTPException(status_code=400, detail="No documents selected")

    prompt = """Generate a comprehensive summary of the provided documents.
Structure it with:
- Key Topics
- Main Points
- Important Details
- Conclusion"""

    summary = await generate(prompt, context)
    return {"summary": summary}


@router.post("/flashcards")
async def generate_flashcards(
    body: GenerateRequest, db: AsyncSession = Depends(get_db)
):
    context = await get_context(body.selected_document_ids, db)
    if not context:
        raise HTTPException(status_code=400, detail="No documents selected")

    prompt = """Generate 10 flashcards from the provided documents.
Return ONLY a JSON array in this exact format, no other text, no markdown, no backticks:
[
  {"front": "question here", "back": "answer here"}
]
Never use "question" or "answer" as keys, always use "front" and "back"."""

    response = await generate(prompt, context)

    try:
        # try direct parse first
        clean = response.strip().strip("```json").strip("```").strip()
        cards = json.loads(clean)
    except json.JSONDecodeError:
        try:
            # try regex fallback
            import re

            match = re.search(r"\[.*?\]", response, re.DOTALL)
            if match:
                cards = json.loads(match.group())
            else:
                raise HTTPException(
                    status_code=500, detail="Failed to parse flashcards"
                )
        except (json.JSONDecodeError, Exception):
            raise HTTPException(status_code=500, detail="Failed to parse flashcards")

    return {"flashcards": cards}


@router.post("/exam")
async def generate_exam(body: GenerateRequest, db: AsyncSession = Depends(get_db)):
    context = await get_context(body.selected_document_ids, db)
    if not context:
        raise HTTPException(status_code=400, detail="No documents selected")

    prompt = """Generate 5 exam questions from the provided documents.
Return ONLY a JSON array in this exact format, no other text:
[
  {"question": "question here", "answer": "detailed answer here"},
  ...
]"""

    response = await generate(prompt, context)
    try:
        questions = json.loads(response)
    except json.JSONDecodeError:
        import re

        match = re.search(r"\[.*\]", response, re.DOTALL)
        if match:
            questions = json.loads(match.group())
        else:
            raise HTTPException(
                status_code=500, detail="Failed to parse exam questions"
            )

    return {"questions": questions}


@router.post("/mcq")
async def generate_mcq(body: GenerateRequest, db: AsyncSession = Depends(get_db)):
    context = await get_context(body.selected_document_ids, db)
    if not context:
        raise HTTPException(status_code=400, detail="No documents selected")

    prompt = """Generate 5 multiple choice questions from the provided documents.
    Return ONLY a JSON array in this exact format, no other text:
    [
      {
        "question": "question here",
        "options": ["option A", "option B", "option C", "option D"],
        "correct_index": 0
      }
    ]
    The correct_index must be the integer index (0, 1, 2, or 3) of the correct option in the options array. Never use an "answer" field."""

    response = await generate(prompt, context)
    try:
        questions = json.loads(response)
    except json.JSONDecodeError:
        import re

        match = re.search(r"\[.*\]", response, re.DOTALL)
        if match:
            questions = json.loads(match.group())
        else:
            raise HTTPException(status_code=500, detail="Failed to parse MCQ questions")

    return {"questions": questions}
