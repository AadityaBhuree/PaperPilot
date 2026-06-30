"""Unit tests for the AI services (evaluator, question detection, RAG)."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio

from backend.services.evaluator_service import CriterionScore, EvaluationInput, evaluate_answer
from backend.services.question_service import (
    detect_questions,
    extract_answers,
)


# ---------------------------------------------------------------------------
# Mock helpers
# ---------------------------------------------------------------------------


class _MockPrompt:
    """A mock prompt that returns a fixed chain when used with the | operator.

    Python's `|` operator calls `type(obj).__or__()`, so we need a real class
    with `__or__` defined — instance-level attribute assignment won't work.
    """

    def __init__(self, chain: MagicMock):
        self._chain = chain

    def __or__(self, other):
        return self._chain

    def __ror__(self, other):
        return self._chain


# ---------------------------------------------------------------------------
# Evaluator service tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
@patch("backend.services.evaluator_service._get_llm")
async def test_evaluate_answer(mock_get_llm):
    """Test that evaluate_answer calls the LLM chain and returns structured output."""
    mock_llm = MagicMock()
    mock_get_llm.return_value = mock_llm

    # Mock the chain invoke result
    mock_result = MagicMock()
    mock_result.score = 8.0
    mock_result.max_score = 10.0
    mock_result.feedback = "Good answer."
    mock_result.confidence = 0.9
    mock_result.criterion_scores = [
        CriterionScore(criterion="Content", score=8.0, feedback="Accurate")
    ]

    # Mock the chain: prompt | llm.with_structured_output(schema)
    mock_structured_llm = MagicMock()
    mock_llm.with_structured_output.return_value = mock_structured_llm

    mock_chain = MagicMock()
    mock_chain.ainvoke = AsyncMock(return_value=mock_result)

    with patch(
        "backend.services.evaluator_service._EVALUATE_PROMPT",
        _MockPrompt(mock_chain),
    ):
        inputs = EvaluationInput(
            question_text="What is calculus?",
            student_answer="Calculus studies change.",
            reference_answer="Calculus is the study of continuous change.",
            key_concepts="limits, derivatives, integrals",
            rubric_criteria=[
                {"criterion": "Content", "description": "Accuracy", "max_score": 10, "weight": 1.0}
            ],
            max_marks=10,
        )

        result = await evaluate_answer(inputs)

        assert result["score"] == 8.0
        assert result["max_score"] == 10.0
        assert result["feedback"] == "Good answer."
        assert result["confidence"] == 0.9
        scores = json.loads(result["criterion_scores"])
        assert len(scores) == 1
        assert scores[0]["criterion"] == "Content"
        assert scores[0]["score"] == 8.0
        assert scores[0]["feedback"] == "Accurate"


# ---------------------------------------------------------------------------
# Question service tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
@patch("backend.services.question_service._get_llm")
async def test_detect_questions(mock_get_llm):
    """Test that detect_questions calls the LLM and returns structured results."""
    mock_llm = MagicMock()
    mock_get_llm.return_value = mock_llm

    mock_result = MagicMock()
    mock_result.questions = [
        MagicMock(question_number=1, question_text="What is 2+2?"),
        MagicMock(question_number=2, question_text="Define gravity."),
    ]

    mock_structured_llm = MagicMock()
    mock_llm.with_structured_output.return_value = mock_structured_llm

    mock_chain = MagicMock()
    mock_chain.ainvoke = AsyncMock(return_value=mock_result)

    with patch(
        "backend.services.question_service._DETECT_QUESTIONS_PROMPT",
        _MockPrompt(mock_chain),
    ):
        result = await detect_questions("1. What is 2+2? 2. Define gravity.")

        assert len(result) == 2
        assert result[0]["question_number"] == 1
        assert result[0]["question_text"] == "What is 2+2?"


@pytest.mark.asyncio
@patch("backend.services.question_service._get_llm")
async def test_extract_answers(mock_get_llm):
    """Test that extract_answers calls the LLM and returns structured results."""
    mock_llm = MagicMock()
    mock_get_llm.return_value = mock_llm

    mock_result = MagicMock()
    mock_result.answers = [
        MagicMock(question_number=1, answer_text="The answer is 4."),
    ]

    mock_structured_llm = MagicMock()
    mock_llm.with_structured_output.return_value = mock_structured_llm

    mock_chain = MagicMock()
    mock_chain.ainvoke = AsyncMock(return_value=mock_result)

    with patch(
        "backend.services.question_service._EXTRACT_ANSWERS_PROMPT",
        _MockPrompt(mock_chain),
    ):
        questions = [{"question_number": 1, "question_text": "What is 2+2?"}]
        result = await extract_answers("1. The answer is 4.", questions)

        assert len(result) == 1
        assert result[0]["answer_text"] == "The answer is 4."
