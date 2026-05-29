import os

import httpx
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health_check():
    return {"status": "ok"}


@router.get("/test-ollama")
async def test_ollama():
    ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{ollama_url}/api/tags")
        return response.json()
