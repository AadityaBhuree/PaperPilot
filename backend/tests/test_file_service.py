"""Unit tests for file upload validation and magic byte inspection."""

import pytest
from backend.services.file_service import validate_magic_bytes, _validate_file


def test_validate_magic_bytes_valid_formats():
    """Test valid headers for all supported formats."""
    # PDF
    validate_magic_bytes(b"%PDF-1.7 header", ".pdf")
    
    # JPEG
    validate_magic_bytes(b"\xff\xd8\xff\xe0\x00\x10JFIF", ".jpg")
    validate_magic_bytes(b"\xff\xd8\xff\xe1\x00\x18Exif", ".jpeg")
    
    # PNG
    validate_magic_bytes(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR", ".png")
    
    # WEBP
    validate_magic_bytes(b"RIFF\x00\x00\x00\x00WEBPVP8 ", ".webp")


def test_validate_magic_bytes_empty():
    """Test that empty payload raises ValueError."""
    with pytest.raises(ValueError, match="File is empty"):
        validate_magic_bytes(b"", ".pdf")


def test_validate_magic_bytes_spoofed_pdf():
    """Test that spoofed text/binary files with .pdf extension are rejected."""
    with pytest.raises(ValueError, match="Missing '%PDF' header signature"):
        validate_magic_bytes(b"<html><body>Malicious script</body></html>", ".pdf")


def test_validate_magic_bytes_spoofed_png():
    """Test that non-PNG payload disguised as .png is rejected."""
    with pytest.raises(ValueError, match="Header signature mismatch for .png"):
        validate_magic_bytes(b"PK\x03\x04\x14\x00", ".png")


def test_validate_file_extension():
    """Test allowed and disallowed file extensions."""
    _validate_file("exam.pdf", "application/pdf")
    _validate_file("answers.jpg", "image/jpeg")
    _validate_file("scan.png", "image/png")
    _validate_file("test.webp", "image/webp")

    with pytest.raises(ValueError, match="Unsupported file type"):
        _validate_file("script.py", "text/x-python")

    with pytest.raises(ValueError, match="Unsupported file type"):
        _validate_file("malware.exe", "application/octet-stream")
