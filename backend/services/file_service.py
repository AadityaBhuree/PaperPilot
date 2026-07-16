"""File upload and storage service."""

import logging
import os
import uuid
from pathlib import Path

import aiofiles
from fastapi import UploadFile

from backend.config import settings

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS: set[str] = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


def _get_extension(filename: str) -> str:
    """Extract lowercase file extension including the dot."""
    _, ext = os.path.splitext(filename)
    return ext.lower()


def _validate_file(filename: str, content_type: str | None) -> None:
    """Raise ValueError if the file type or size is not allowed."""
    ext = _get_extension(filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type '{ext}'. "
            f"Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )


def _generate_stored_filename(original_filename: str) -> str:
    """Return a UUID-based filename preserving the original extension."""
    ext = _get_extension(original_filename)
    return f"{uuid.uuid4().hex}{ext}"


MAGIC_BYTES = {
    ".pdf": b"%PDF",
    ".jpg": b"\xff\xd8\xff",
    ".jpeg": b"\xff\xd8\xff",
    ".png": b"\x89PNG\r\n\x1a\n",
}

async def save_upload(file: UploadFile) -> dict[str, str | int]:
    """Validate, save, and return metadata about the uploaded file.

    Returns a dict with keys: stored_filename, original_filename,
    file_type, file_size.
    """
    filename = file.filename or "unknown"
    _validate_file(filename, file.content_type)
    ext = _get_extension(filename)

    # Validate magic bytes
    first_chunk = await file.read(2048)
    if not first_chunk:
        raise ValueError("File is empty")
        
    expected_magic = MAGIC_BYTES.get(ext)
    if expected_magic and not first_chunk.startswith(expected_magic):
        raise ValueError(f"Invalid file content. Does not match extension {ext}")
        
    await file.seek(0)

    stored_name = _generate_stored_filename(filename)
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / stored_name

    file_size = 0
    async with aiofiles.open(file_path, "wb") as buffer:
        while chunk := await file.read(8192):
            file_size += len(chunk)
            if file_size > MAX_FILE_SIZE_BYTES:
                await file.close()
                # Clean up partially written file
                file_path.unlink(missing_ok=True)
                raise ValueError(
                    f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB} MB"
                )
            await buffer.write(chunk)

    ext = _get_extension(filename).lstrip(".")
    logger.info("Saved upload %s (%d bytes)", stored_name, file_size)

    return {
        "stored_filename": stored_name,
        "original_filename": filename,
        "file_type": ext,
        "file_size": file_size,
    }


def get_file_path(stored_filename: str) -> Path:
    """Return the full path to a stored file."""
    return Path(settings.UPLOAD_DIR) / stored_filename


def delete_file(stored_filename: str) -> bool:
    """Remove a stored file from disk. Returns True if deleted."""
    path = get_file_path(stored_filename)
    if path.exists():
        path.unlink()
        logger.info("Deleted file %s", stored_filename)
        return True
    return False
