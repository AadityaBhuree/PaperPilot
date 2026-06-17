"""OCR processing service using EasyOCR and PyMuPDF."""

import logging
from pathlib import Path

from backend.config import settings

logger = logging.getLogger(__name__)

# Module-level reader initialized lazily to avoid heavy startup cost.
_reader = None


def _get_reader():
    """Return the shared EasyOCR reader, creating it on first call."""
    global _reader  # noqa: PLW0603
    if _reader is None:
        import easyocr

        languages = settings.OCR_LANGUAGES
        logger.info("Initializing EasyOCR reader for languages: %s", languages)
        _reader = easyocr.Reader(languages, gpu=settings.OCR_GPU)
    return _reader


def _ocr_image(image) -> list[dict[str, object]]:
    """Run OCR on a single PIL Image and return structured results."""
    import numpy as np

    reader = _get_reader()
    img_array = np.array(image)
    raw_results = reader.readtext(img_array)

    results: list[dict[str, object]] = []
    for bbox, text, confidence in raw_results:
        results.append(
            {
                "text": str(text),
                "confidence": float(confidence),
                "bbox": bbox,
            }
        )
    return results


def _merge_results(page_results: list[dict[str, object]]) -> tuple[str, float]:
    """Merge multiple OCR hits on a page into a single text block.

    Returns (combined_text, average_confidence).
    """
    if not page_results:
        return "", 0.0

    texts = [r["text"] for r in page_results if r["text"]]
    confidences = [r["confidence"] for r in page_results if r["confidence"]]

    combined = "\n".join(texts) if texts else ""
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
    return combined, avg_confidence


def _process_pdf(file_path: Path) -> list[dict[str, object]]:
    """Extract text from each page of a PDF.

    First tries native text extraction (for digital PDFs).
    Falls back to rendering the page as an image and running OCR
    (for scanned PDFs).
    """
    import fitz  # PyMuPDF
    from PIL import Image

    doc = fitz.open(str(file_path))
    page_results: list[dict[str, object]] = []

    for page_idx in range(len(doc)):
        page = doc[page_idx]

        # Attempt native text extraction first
        native_text = page.get_text("text").strip()

        if native_text:
            # Digital PDF — text is already available
            page_results.append(
                {
                    "page_number": page_idx + 1,
                    "extracted_text": native_text,
                    "confidence": 1.0,
                }
            )
        else:
            # Scanned PDF — render to image and OCR
            pix = page.get_pixmap(dpi=200)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            ocr_hits = _ocr_image(img)
            text, confidence = _merge_results(ocr_hits)
            page_results.append(
                {
                    "page_number": page_idx + 1,
                    "extracted_text": text,
                    "confidence": confidence,
                }
            )

    doc.close()
    return page_results


def _process_image(file_path: Path) -> list[dict[str, object]]:
    """Run OCR on a single image file."""
    from PIL import Image

    image = Image.open(file_path)
    ocr_hits = _ocr_image(image)
    text, confidence = _merge_results(ocr_hits)
    return [
        {
            "page_number": 1,
            "extracted_text": text,
            "confidence": confidence,
        }
    ]


def process_document(file_path: Path, file_type: str) -> list[dict[str, object]]:
    """Process a document and return per-page OCR results.

    Args:
        file_path: Path to the file on disk.
        file_type: Lowercase extension without dot (e.g. "pdf", "png").

    Returns:
        List of dicts with keys: page_number, extracted_text, confidence.
    """
    logger.info("Processing document %s (type=%s)", file_path.name, file_type)

    if file_type == "pdf":
        return _process_pdf(file_path)

    return _process_image(file_path)
