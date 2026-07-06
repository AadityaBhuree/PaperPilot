"""Centralized AI model configuration for all PaperPilot services.

All LLM instances should be created through this module to ensure
consistent model selection, API key management, and configuration.
"""

import logging

from langchain_google_genai import ChatGoogleGenerativeAI

from backend.config import settings

logger = logging.getLogger(__name__)


def get_llm(
    *,
    model: str | None = None,
    temperature: float = 0.0,
) -> ChatGoogleGenerativeAI:
    """Return a configured Gemini LLM instance.

    Args:
        model:  The Gemini model name. Defaults to ``settings.GEMINI_MODEL``.
        temperature:  Sampling temperature (0.0 = deterministic, 1.0 = creative).

    Returns:
        A ready-to-use LangChain chat model instance.
    """
    return ChatGoogleGenerativeAI(
        model=model or settings.GEMINI_MODEL,
        google_api_key=settings.GEMINI_API_KEY,
        temperature=temperature,
    )
