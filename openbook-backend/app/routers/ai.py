import json
import os
from datetime import datetime
from typing import NotRequired, TypedDict
from uuid import uuid4

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db
from app.models.schemas import Chunk, Document, Flashcard, Message, Summary
from app.services.ollama_service import generate, stream_chat

router = APIRouter()


class UserMessage(TypedDict):
    role: str
    content: str
    images: NotRequired[list[str]]


class ChatRequest(BaseModel):
    openbook_id: str
    message: str
    selected_document_ids: list[str]
    conversation_history: list[dict]
    ollama_url: str | None = None
    ollama_model: str | None = None
    images: list[str] | None = None


class GenerateRequest(BaseModel):
    openbook_id: str
    selected_document_ids: list[str]
    ollama_url: str | None = None
    ollama_model: str | None = None


async def get_context(document_ids: list[str], db: AsyncSession) -> str:
    if not document_ids:
        return ""

    result = await db.execute(
        select(Chunk)
        .where(Chunk.document_id.in_(document_ids))
        .order_by(Chunk.document_id, Chunk.page_number)
    )
    chunks = result.scalars().all()

    if not chunks:
        # fallback to full document text if no chunks
        result = await db.execute(select(Document).where(Document.id.in_(document_ids)))
        docs = result.scalars().all()
        context = ""
        for doc in docs:
            context += f"\n--- {doc.name} ---\n{doc.content}\n"
        return context.strip()

    # get document names
    doc_result = await db.execute(select(Document).where(Document.id.in_(document_ids)))
    docs = {d.id: d.name for d in doc_result.scalars().all()}

    context = ""
    for chunk in chunks:
        doc_name = docs.get(chunk.document_id, "Unknown Document")
        context += f"\n[{doc_name} — Page {chunk.page_number}]\n{chunk.content}\n"

    # debug print to check context overflow
    # print(f"Context length: {len(context)} chars, ~{len(context) // 4} tokens")
    return context.strip()


@router.post("/chat")
async def chat(body: ChatRequest, db: AsyncSession = Depends(get_db)):
    context = await get_context(body.selected_document_ids, db)

    user_message: UserMessage = {"role": "user", "content": body.message}
    if body.images:
        user_message["images"] = body.images

    messages = [*body.conversation_history, user_message]

    async def event_stream():
        full_response = ""
        async for chunk in stream_chat(
            messages,
            context,
            ollama_url=body.ollama_url,
            ollama_model=body.ollama_model,
        ):
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

    summary = await generate(
        prompt,
        context,
        ollama_url=body.ollama_url,
        ollama_model=body.ollama_model,
    )
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

    response = await generate(
        prompt,
        context,
        ollama_url=body.ollama_url,
        ollama_model=body.ollama_model,
    )

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

    response = await generate(
        prompt,
        context,
        ollama_url=body.ollama_url,
        ollama_model=body.ollama_model,
    )
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

    response = await generate(
        prompt,
        context,
        ollama_url=body.ollama_url,
        ollama_model=body.ollama_model,
    )
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


class MarkExamRequest(BaseModel):
    openbook_id: str
    questions_and_answers: list[dict]  # [{question, model_answer, user_answer}]


@router.post("/mark-exam")
async def mark_exam(body: MarkExamRequest, db: AsyncSession = Depends(get_db)):
    prompt = f"""You are marking a student's exam. For each question, compare the student's answer to the model answer and provide:
1. A score out of 10
2. Brief encouraging feedback
3. What they got right
4. What they missed (if anything)

Questions and answers:
{json.dumps(body.questions_and_answers, indent=2)}

Return ONLY a JSON object in this exact format, no other text:
{{
  "total_score": 0,
  "max_score": 0,
  "percentage": 0,
  "results": [
    {{
      "question": "...",
      "user_answer": "...",
      "score": 0,
      "max_score": 10,
      "feedback": "...",
      "what_you_got_right": "...",
      "what_you_missed": "..."
    }}
  ]
}}"""

    response = await generate(
        prompt,
        "",
        ollama_url=body.ollama_url,
        ollama_model=body.ollama_model,
    )

    try:
        clean = response.strip().strip("```json").strip("```").strip()
        result = json.loads(clean)
    except json.JSONDecodeError:
        import re

        match = re.search(r"\{.*\}", response, re.DOTALL)
        if match:
            result = json.loads(match.group())
        else:
            raise HTTPException(
                status_code=500, detail="Failed to parse marking results"
            )

    return result


@router.get("/models")
async def get_models():
    ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{ollama_url}/api/tags")
            data = response.json()

            models = []
            for m in data.get("models", []):
                try:
                    show = await client.post(
                        f"{ollama_url}/api/show", json={"name": m["name"]}
                    )
                    show_data = show.json()
                    capabilities = show_data.get("capabilities", [])
                except Exception:
                    capabilities = []

                models.append(
                    {
                        "name": m["name"],
                        "size": m.get("size", 0),
                        "modified_at": m.get("modified_at"),
                        "capabilities": capabilities,
                    }
                )
            return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Could not reach Ollama: {str(e)}")
