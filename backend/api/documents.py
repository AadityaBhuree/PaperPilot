"""API routes for document upload and OCR processing."""

import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.connection import get_session
from backend.models.document import DocumentStatus, OCRResult, UploadedDocument
from backend.schemas.document import (
    DocumentResponse,
    OCRResponse,
    OCRResultResponse,
    UploadResponse,
)
from backend.services.file_service import save_upload, get_file_path, delete_file
from backend.services.ocr_service import process_document

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/upload", response_model=UploadResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_session),
) -> UploadResponse:
    """Upload an image or PDF for later OCR processing."""
    try:
        metadata = await save_upload(file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    doc = UploadedDocument(
        original_filename=metadata["original_filename"],
        stored_filename=metadata["stored_filename"],
        file_type=metadata["file_type"],
        file_size=metadata["file_size"],
        status=DocumentStatus.PENDING,
    )
    db.add(doc)
    await db.flush()

    return UploadResponse(
        document_id=doc.id,
        filename=doc.original_filename,
        file_type=doc.file_type,
        file_size=doc.file_size,
    )


@router.post("/{document_id}/process", response_model=OCRResponse)
async def process_document_endpoint(
    document_id: str,
    db: AsyncSession = Depends(get_session),
) -> OCRResponse:
    """Run OCR on an already-uploaded document and store results."""
    doc = await _get_document_or_404(document_id, db)

    # Update status to processing
    doc.status = DocumentStatus.PROCESSING
    await db.flush()

    file_path = get_file_path(doc.stored_filename)
    if not file_path.exists():
        doc.status = DocumentStatus.FAILED
        await db.flush()
        raise HTTPException(status_code=404, detail="File not found on disk")

    try:
        page_results = process_document(file_path, doc.file_type)
    except Exception as exc:
        logger.error("OCR failed for document %s: %s", document_id, exc)
        doc.status = DocumentStatus.FAILED
        await db.flush()
        raise HTTPException(
            status_code=500, detail=f"OCR processing failed: {exc}"
        ) from exc

    # Persist OCR results
    ocr_results: list[OCRResult] = []
    for page in page_results:
        result = OCRResult(
            document_id=doc.id,
            page_number=page["page_number"],
            extracted_text=page["extracted_text"],
            confidence=page["confidence"],
        )
        db.add(result)
        ocr_results.append(result)

    doc.status = DocumentStatus.COMPLETED
    await db.flush()

    return OCRResponse(
        document_id=doc.id,
        status=doc.status,
        results=[
            OCRResultResponse.model_validate(r) for r in ocr_results
        ],
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    db: AsyncSession = Depends(get_session),
) -> DocumentResponse:
    """Retrieve document metadata and its OCR results."""
    doc = await _get_document_or_404(document_id, db)
    return DocumentResponse.model_validate(doc)


@router.get("/", response_model=list[DocumentResponse])
async def list_documents(
    db: AsyncSession = Depends(get_session),
) -> list[DocumentResponse]:
    """List all uploaded documents."""
    result = await db.execute(
        select(UploadedDocument).order_by(UploadedDocument.uploaded_at.desc())
    )
    docs = result.scalars().all()
    return [DocumentResponse.model_validate(d) for d in docs]


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_session),
) -> None:
    """Delete a document, its OCR results, and the stored file."""
    doc = await _get_document_or_404(document_id, db)

    # Remove the file from disk
    delete_file(doc.stored_filename)

    # Delete the DB record (cascades to OCR results)
    await db.delete(doc)


async def _get_document_or_404(
    document_id: str, db: AsyncSession
) -> UploadedDocument:
    """Fetch a document by ID or raise 404."""
    result = await db.execute(
        select(UploadedDocument).where(UploadedDocument.id == document_id)
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc
