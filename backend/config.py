"""Application configuration loaded from environment variables."""

import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "PaperPilot")
    APP_VERSION: str = os.getenv("APP_VERSION", "0.1.0")
    DEBUG: bool = os.getenv("DEBUG", "False") == "True"

    # AI / LLM
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Database — use aiosqlite for async SQLite support
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite+aiosqlite:///paperpilot.db",
    )

    # File uploads
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "20"))

    # OCR
    OCR_LANGUAGES: list[str] = os.getenv("OCR_LANGUAGES", "en").split(",")
    OCR_GPU: bool = os.getenv("OCR_GPU", "False") == "True"


settings = Settings()
