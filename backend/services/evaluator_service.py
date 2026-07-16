"""AI evaluation engine — grades student answers using Gemini + rubric criteria."""

import json
import logging
from dataclasses import dataclass

from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException

from backend.config import settings
from backend.services.ai_config import get_llm
from backend.models.evaluation import Evaluation, StudentSubmission
from backend.models.exam import Exam, Question
from backend.models.document import UploadedDocument
from backend.schemas.evaluation import EvaluateSubmissionResponse, EvaluationResponse, CriterionScoreResponse
from backend.services.ocr_service import ensure_ocr_text
from backend.services.question_service import detect_questions, extract_answers
from backend.services.rag_service import build_vector_store, retrieve_references

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
    llm = get_llm(temperature=0.1)
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


async def run_evaluation(submission_id: str, db: AsyncSession) -> EvaluateSubmissionResponse:
    """Core evaluation pipeline shared by single and batch endpoints."""
    # 1. Load submission
    result = await db.execute(
        select(StudentSubmission)
        .where(StudentSubmission.id == submission_id)
        .options(selectinload(StudentSubmission.document))
    )
    submission = result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=404, detail=f"Submission {submission_id} not found")

    doc: UploadedDocument = submission.document

    # 2. Get OCR text
    ocr_text = await ensure_ocr_text(doc, db)

    # 3. Load exam with questions, answer keys, and rubrics
    exam_result = await db.execute(
        select(Exam)
        .where(Exam.id == submission.exam_id)
        .options(
            selectinload(Exam.questions)
            .selectinload(Question.answer_key),
            selectinload(Exam.questions)
            .selectinload(Question.rubrics),
        )
    )
    exam = exam_result.scalar_one_or_none()
    if exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")

    # 4. Detect questions and extract answers from OCR text
    detected_questions = await detect_questions(ocr_text)
    extracted_answers = await extract_answers(ocr_text, detected_questions)

    answers_by_qnum: dict[int, str] = {
        a["question_number"]: a["answer_text"] for a in extracted_answers
    }

    # 5. Build RAG index from answer keys
    answer_key_data = []
    for q in exam.questions:
        if q.answer_key:
            answer_key_data.append({
                "question_id": q.id,
                "question_text": q.question_text,
                "reference_answer": q.answer_key.reference_answer,
                "key_concepts": q.answer_key.key_concepts or "",
            })

    vector_store = None
    if answer_key_data:
        vector_store = build_vector_store(answer_key_data)

    # 6. Evaluate each question
    total_score = 0.0
    max_possible = 0.0
    evaluations: list[Evaluation] = []

    for q in exam.questions:
        student_answer = answers_by_qnum.get(q.question_number, "")

        ref_answer = q.answer_key.reference_answer if q.answer_key else ""
        key_concepts = q.answer_key.key_concepts if q.answer_key else ""

        if not ref_answer and vector_store and student_answer:
            refs = retrieve_references(student_answer, vector_store, k=1)
            if refs:
                ref_answer = refs[0]["reference_text"]
                key_concepts = ""

        rubric_criteria = [
            {
                "criterion": r.criterion,
                "description": r.description,
                "max_score": r.max_score,
                "weight": r.weight,
            }
            for r in q.rubrics
        ]

        eval_input = EvaluationInput(
            question_text=q.question_text,
            student_answer=student_answer,
            reference_answer=ref_answer,
            key_concepts=key_concepts,
            rubric_criteria=rubric_criteria,
            max_marks=q.max_marks,
        )
        eval_result = await evaluate_answer(eval_input)

        evaluation = Evaluation(
            submission_id=submission.id,
            question_id=q.id,
            extracted_answer=student_answer,
            score=eval_result["score"],
            max_score=eval_result["max_score"],
            feedback=eval_result["feedback"],
            criterion_scores=eval_result["criterion_scores"],
            confidence=eval_result["confidence"],
        )
        db.add(evaluation)
        evaluations.append(evaluation)

        total_score += eval_result["score"]
        max_possible += eval_result["max_score"]

    await db.flush()

    percentage = (total_score / max_possible * 100) if max_possible > 0 else 0.0
    eval_responses = [to_eval_response(e) for e in evaluations]

    return EvaluateSubmissionResponse(
        submission_id=submission.id,
        status="completed",
        total_score=total_score,
        max_possible_score=max_possible,
        percentage=round(percentage, 2),
        evaluations=eval_responses,
    )


def to_eval_response(e: Evaluation) -> EvaluationResponse:
    """Convert an Evaluation ORM object to a response schema."""
    criterion_scores: list[CriterionScoreResponse] = []
    if e.criterion_scores:
        try:
            raw = json.loads(e.criterion_scores)
            criterion_scores = [CriterionScoreResponse(**cs) for cs in raw]
        except (json.JSONDecodeError, TypeError) as exc:
            logger.error("Failed to parse criterion scores for evaluation %s: %s", e.id, exc)

    return EvaluationResponse(
        id=e.id,
        submission_id=e.submission_id,
        question_id=e.question_id,
        extracted_answer=e.extracted_answer,
        score=e.score,
        max_score=e.max_score,
        feedback=e.feedback,
        criterion_scores=criterion_scores,
        confidence=e.confidence,
        evaluated_at=e.evaluated_at,
    )
