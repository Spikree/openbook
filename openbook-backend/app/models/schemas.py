from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.models.database import Base


class OpenBook(Base):
    __tablename__ = "openbooks"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    documents = relationship(
        "Document", back_populates="openbook", cascade="all, delete"
    )
    conversations = relationship(
        "Message", back_populates="openbook", cascade="all, delete"
    )
    flashcards = relationship(
        "Flashcard", back_populates="openbook", cascade="all, delete"
    )
    summaries = relationship(
        "Summary", back_populates="openbook", cascade="all, delete"
    )


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True)
    openbook_id = Column(String, ForeignKey("openbooks.id"), nullable=False)
    name = Column(String, nullable=False)
    size = Column(Integer)
    content = Column(Text)  # extracted text
    file_path = Column(String)  # path to stored PDF
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    is_selected = Column(Integer, default=1)

    openbook = relationship("OpenBook", back_populates="documents")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True)
    openbook_id = Column(String, ForeignKey("openbooks.id"), nullable=False)
    role = Column(String, nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    openbook = relationship("OpenBook", back_populates="conversations")


class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(String, primary_key=True)
    openbook_id = Column(String, ForeignKey("openbooks.id"), nullable=False)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    interval = Column(Integer, default=1)
    ease_factor = Column(Float, default=2.5)
    due_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    openbook = relationship("OpenBook", back_populates="flashcards")


class Summary(Base):
    __tablename__ = "summaries"

    id = Column(String, primary_key=True)
    openbook_id = Column(String, ForeignKey("openbooks.id"), nullable=False)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    openbook = relationship("OpenBook", back_populates="summaries")
