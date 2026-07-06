"""Application configuration loaded from environment variables.

Uses pydantic-settings for automatic type coercion and validation.
"""

from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All application settings, loaded from environment variables / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    APP_NAME: str = "PaperPilot"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # AI / LLM
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///paperpilot.db"

    # File uploads
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: Annotated[int, Field(ge=1, le=500)] = 20

    # OCR
    OCR_LANGUAGES: list[str] = ["en"]
    OCR_GPU: bool = False

    # --- validators ---

    @field_validator("OCR_LANGUAGES", mode="before")
    @classmethod
    def _split_ocr_languages(cls, v: object) -> list[str]:
        """Accept a comma-separated string from the .env file."""
        if isinstance(v, str):
            return [lang.strip() for lang in v.split(",") if lang.strip()]
        # pydantic-settings may already parse it as a list from JSON
        if isinstance(v, list):
            return [str(lang).strip() for lang in v if lang]
        return ["en"]


settings = Settings()

