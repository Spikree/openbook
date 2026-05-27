from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import ai, documents, health, openbooks

app = FastAPI(title="OpenBook API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(openbooks.router, prefix="/api/openbooks")
app.include_router(documents.router, prefix="/api/documents")
app.include_router(ai.router, prefix="/api/ai")
