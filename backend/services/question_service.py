"""Question detection and answer extraction from OCR text using Gemini."""

import json
import logging

from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field

from backend.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Pydantic schemas for structured LLM output
# ---------------------------------------------------------------------------

class DetectedQuestion(BaseModel):
    """A single detected question from OCR text."""

    question_number: int = Field(description="Sequential question number (1, 2, 3, ...)")
    question_text: str = Field(description="Full text of the question")


class DetectedQuestions(BaseModel):
    """All questions detected in the OCR text."""

    questions: list[DetectedQuestion] = Field(description="List of detected questions")


class ExtractedAnswer(BaseModel):
    """A single extracted student answer."""

    question_number: int = Field(description="Question number this answer corresponds to")
    answer_text: str = Field(description="Full text of the student's answer")


class ExtractedAnswers(BaseModel):
    """All answers extracted from the OCR text."""

    answers: list[ExtractedAnswer] = Field(description="List of extracted answers")


# ---------------------------------------------------------------------------
# LLM setup
# ---------------------------------------------------------------------------

def _get_llm() -> ChatGoogleGenerativeAI:
    """Return a Gemini LLM instance configured from app settings."""
    return ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=settings.GEMINI_API_KEY,
        temperature=0.0,
    )


# ---------------------------------------------------------------------------
# Question detection
# ---------------------------------------------------------------------------

_DETECT_QUESTIONS_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are an expert at parsing OCR'd exam answer sheets. "
        "Your task is to identify and extract all distinct questions from the text. "
        "Questions may be numbered (1., Q1, Question 1, etc.) or separated by whitespace. "
        "Return ONLY the structured data — no commentary.",
    ),
    (
        "user",
        "Here is the OCR-extracted text from a student's answer sheet:\n\n"
        "---\n{ocr_text}\n---\n\n"
        "Detect all questions present in this text.",
    ),
])


async def detect_questions(ocr_text: str) -> list[dict[str, object]]:
    """Detect questions from OCR text using Gemini.

    Returns a list of dicts with keys: question_number, question_text.
    """
    llm = _get_llm()
    chain = _DETECT_QUESTIONS_PROMPT | llm.with_structured_output(DetectedQuestions)

    logger.info("Detecting questions from OCR text (%d chars)", len(ocr_text))
    result = await chain.ainvoke({"ocr_text": ocr_text})

    questions = [
        {"question_number": q.question_number, "question_text": q.question_text}
        for q in result.questions
    ]
    logger.info("Detected %d questions", len(questions))
    return questions


# ---------------------------------------------------------------------------
# Answer extraction
# ---------------------------------------------------------------------------

_EXTRACT_ANSWERS_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are an expert at parsing OCR'd exam answer sheets. "
        "Your task is to extract the student's answer for each question. "
        "Map each answer to the correct question number. "
        "If a question has no answer, skip it. "
        "Return ONLY the structured data — no commentary.",
    ),
    (
        "user",
        "Here is the OCR-extracted text from a student's answer sheet:\n\n"
        "---\n{ocr_text}\n---\n\n"
        "The questions in this exam are:\n{questions_json}\n\n"
        "Extract the student's answer for each question.",
    ),
])


async def extract_answers(
    ocr_text: str, questions: list[dict[str, object]]
) -> list[dict[str, object]]:
    """Extract student answers mapped to question numbers.

    Returns a list of dicts with keys: question_number, answer_text.
    """
    llm = _get_llm()
    chain = _EXTRACT_ANSWERS_PROMPT | llm.with_structured_output(ExtractedAnswers)

    questions_json = json.dumps(questions, indent=2)
    logger.info("Extracting answers from OCR text (%d chars)", len(ocr_text))
    result = await chain.ainvoke({"ocr_text": ocr_text, "questions_json": questions_json})

    answers = [
        {"question_number": a.question_number, "answer_text": a.answer_text}
        for a in result.answers
    ]
    logger.info("Extracted %d answers", len(answers))
    return answers
