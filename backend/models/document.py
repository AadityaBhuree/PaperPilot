"""ORM models for uploaded documents and OCR results."""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Float, ForeignKey, Integer, String, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.models.base import Base


class DocumentStatus(str, enum.Enum):
    """Processing status of an uploaded document."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class UploadedDocument(Base):
    """Represents a user-uploaded document (image or PDF)."""

    __tablename__ = "uploaded_documents"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    original_filename: Mapped[str] = mapped_column(String(255))
    stored_filename: Mapped[str] = mapped_column(String(255), unique=True)
    file_type: Mapped[str] = mapped_column(String(10))  # e.g. "pdf", "png", "jpg"
    file_size: Mapped[int] = mapped_column(Integer)  # bytes
    status: Mapped[DocumentStatus] = mapped_column(
        Enum(DocumentStatus), default=DocumentStatus.PENDING
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc)
    )

    ocr_results: Mapped[list["OCRResult"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<UploadedDocument {self.original_filename!r} ({self.file_type})>"


class OCRResult(Base):
    """Stores OCR output for a single page of a document."""

    __tablename__ = "ocr_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    document_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("uploaded_documents.id", ondelete="CASCADE")
    )
    page_number: Mapped[int] = mapped_column(Integer)
    extracted_text: Mapped[str] = mapped_column(Text)
    confidence: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc)
    )

    document: Mapped["UploadedDocument"] = relationship(back_populates="ocr_results")

    def __repr__(self) -> str:
        return f"<OCRResult page={self.page_number} confidence={self.confidence:.2f}>"
