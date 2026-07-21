"""AI Rubric & Answer Key Generator service using Gemini 1.5 Flash."""

import json
import logging
from pydantic import BaseModel, Field

from backend.services.ai_config import get_llm

logger = logging.getLogger(__name__)


class GeneratedRubricCriterion(BaseModel):
    criterion: str = Field(description="Short title of grading criterion (e.g. 'Conceptual Clarity')")
    description: str = Field(description="Detailed explanation of what full marks requires")
    max_score: float = Field(description="Maximum marks for this criterion")
    weight: float = Field(default=1.0, description="Criterion weighting multiplier")


class GeneratedQuestionKeyAndRubrics(BaseModel):
    reference_answer: str = Field(description="Ideal model answer to earn full marks")
    key_concepts: list[str] = Field(description="List of 3-5 core concepts required")
    rubrics: list[GeneratedRubricCriterion] = Field(description="List of weighted rubric criteria totaling question max marks")


async def generate_rubric_and_key(
    question_number: int,
    question_text: str,
    max_marks: float,
) -> dict:
    """Auto-generate reference answer key and rubrics for a question using Gemini 1.5."""
    prompt = (
        f"You are a master academic examiner generating grading criteria for Question #{question_number}:\n"
        f"Prompt: \"{question_text}\"\n"
        f"Total Max Marks: {max_marks}\n\n"
        f"Generate:\n"
        f"1. A comprehensive reference answer.\n"
        f"2. A list of key concepts required.\n"
        f"3. A list of 3-4 rubric criteria whose max_score values sum up exactly to {max_marks}.\n"
    )

    try:
        llm = get_llm(temperature=0.1)
        structured_llm = llm.with_structured_output(GeneratedQuestionKeyAndRubrics)
        res: GeneratedQuestionKeyAndRubrics = await structured_llm.ainvoke(prompt)
        return res.model_dump()
    except Exception as exc:
        logger.error("Structured LLM rubric generation failed: %s", exc)
        # Fallback dictionary
        return {
            "reference_answer": f"Standard model answer for question #{question_number}.",
            "key_concepts": ["Accuracy", "Completeness", "Clarity"],
            "rubrics": [
                {
                    "criterion": "Content Accuracy",
                    "description": "Demonstrates correct technical understanding.",
                    "max_score": round(max_marks * 0.7, 1),
                    "weight": 1.0,
                },
                {
                    "criterion": "Clarity & Organization",
                    "description": "Clear presentation and proper structure.",
                    "max_score": round(max_marks * 0.3, 1),
                    "weight": 1.0,
                },
            ],
        }
