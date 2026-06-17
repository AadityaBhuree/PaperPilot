"""AI evaluation engine — grades student answers using Gemini + rubric criteria."""

import json
import logging
from dataclasses import dataclass

from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field

from backend.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Structured output schema
# ---------------------------------------------------------------------------

class CriterionScore(BaseModel):
    """Score and feedback for a single rubric criterion."""

    criterion: str = Field(description="Name of the rubric criterion")
    score: float = Field(description="Score awarded for this criterion")
    feedback: str = Field(description="Explanation for this criterion's score")


class EvaluationResult(BaseModel):
    """Full evaluation result for a single question."""

    score: float = Field(description="Total score awarded (0 to max_marks)")
    max_score: float = Field(description="Maximum possible score")
    feedback: str = Field(description="Overall feedback and explanation")
    confidence: float = Field(
        ge=0.0, le=1.0,
        description="Confidence in the evaluation (0.0 to 1.0)",
    )
    criterion_scores: list[CriterionScore] = Field(
        description="Per-criterion scoring breakdown"
    )


# ---------------------------------------------------------------------------
# LLM setup
# ---------------------------------------------------------------------------

def _get_llm() -> ChatGoogleGenerativeAI:
    """Return a Gemini LLM instance configured from app settings."""
    return ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=settings.GEMINI_API_KEY,
        temperature=0.1,
    )


# ---------------------------------------------------------------------------
# Evaluation prompt
# ---------------------------------------------------------------------------

_EVALUATE_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are an expert, fair, and unbiased exam evaluator. "
        "Your job is to grade a student's answer against a reference answer and grading rubric.\n\n"
        "Guidelines:\n"
        "- Be fair and consistent in your evaluation.\n"
        "- Award partial credit where appropriate.\n"
        "- Provide clear, constructive feedback explaining the score.\n"
        "- Base your evaluation ONLY on the content provided — do not assume extra knowledge.\n"
        "- For each rubric criterion, explain what the student did well or missed.\n"
        "- Assign a confidence score: 1.0 for clear-cut cases, lower when the answer is ambiguous.\n",
    ),
    (
        "user",
        "## Question\n{question_text}\n\n"
        "## Student Answer\n{student_answer}\n\n"
        "## Reference Answer\n{reference_answer}\n\n"
        "## Key Concepts to Look For\n{key_concepts}\n\n"
        "## Grading Rubric\n{rubric_text}\n\n"
        "## Total Marks: {max_marks}\n\n"
        "Evaluate the student's answer. Provide a score, per-criterion breakdown, "
        "overall feedback, and your confidence level.",
    ),
])


@dataclass
class EvaluationInput:
    """All inputs needed to evaluate a single answer."""

    question_text: str
    student_answer: str
    reference_answer: str
    key_concepts: str
    rubric_criteria: list[dict[str, object]]
    max_marks: int


async def evaluate_answer(inputs: EvaluationInput) -> dict[str, object]:
    """Evaluate a single student answer using Gemini.

    Args:
        inputs: All the evaluation inputs (question, answer, reference, rubric).

    Returns:
        Dict with keys: score, max_score, feedback, confidence, criterion_scores.
    """
    llm = _get_llm()
    chain = _EVALUATE_PROMPT | llm.with_structured_output(EvaluationResult)

    # Format rubric as readable text
    rubric_lines = []
    for r in inputs.rubric_criteria:
        rubric_lines.append(
            f"- {r['criterion']}: {r['description']} "
            f"(max {r['max_score']} pts, weight {r.get('weight', 1.0)})"
        )
    rubric_text = "\n".join(rubric_lines) if rubric_lines else "No specific rubric provided."

    logger.info(
        "Evaluating answer for question: %s...",
        inputs.question_text[:80],
    )

    result = await chain.ainvoke({
        "question_text": inputs.question_text,
        "student_answer": inputs.student_answer,
        "reference_answer": inputs.reference_answer,
        "key_concepts": inputs.key_concepts or "Not specified",
        "rubric_text": rubric_text,
        "max_marks": str(inputs.max_marks),
    })

    # Serialize criterion_scores to JSON string
    criterion_scores_json = json.dumps(
        [cs.model_dump() for cs in result.criterion_scores],
        indent=2,
    )

    output = {
        "score": result.score,
        "max_score": result.max_score,
        "feedback": result.feedback,
        "confidence": result.confidence,
        "criterion_scores": criterion_scores_json,
    }

    logger.info(
        "Evaluation complete: score=%.1f/%.1f confidence=%.2f",
        result.score,
        result.max_score,
        result.confidence,
    )
    return output
