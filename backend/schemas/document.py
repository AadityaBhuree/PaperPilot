"""Pydantic schemas for document upload and OCR responses."""

from datetime import datetime

from pydantic import BaseModel, Field

from backend.models.document import DocumentStatus


class UploadResponse(BaseModel):
    """Response returned after a successful file upload."""

    document_id: str
    filename: str
    file_type: str
    file_size: int
    message: str = "File uploaded successfully"


class OCRResultResponse(BaseModel):
    """Single page OCR result."""

    page_number: int
    extracted_text: str
    confidence: float = Field(ge=0.0, le=1.0)

    model_config = {"from_attributes": True}


class DocumentResponse(BaseModel):
    """Full document metadata with optional OCR results."""

    id: str
    original_filename: str
    file_type: str
    file_size: int
    status: DocumentStatus
    uploaded_at: datetime
    ocr_results: list[OCRResultResponse] = []

    model_config = {"from_attributes": True}


class OCRResponse(BaseModel):
    """Response returned after OCR processing completes."""

    document_id: str
    status: DocumentStatus
    results: list[OCRResultResponse]
