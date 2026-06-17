"""API routes for exams, questions, answer keys, and rubrics."""

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.database.connection import get_session
from backend.models.exam import AnswerKey, Exam, Question, Rubric
from backend.schemas.exam import (
    AnswerKeyCreate,
    AnswerKeyResponse,
    ExamCreate,
    ExamDetailResponse,
    ExamResponse,
    ExamUpdate,
    QuestionCreate,
    QuestionDetailResponse,
    QuestionResponse,
    RubricCreate,
    RubricResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/exams", tags=["exams"])


# ---------------------------------------------------------------------------
# Exam endpoints
# ---------------------------------------------------------------------------


@router.post("/", response_model=ExamResponse, status_code=201)
async def create_exam(
    body: ExamCreate,
    db: AsyncSession = Depends(get_session),
) -> ExamResponse:
    """Create a new exam."""
    exam = Exam(
        title=body.title,
        description=body.description,
        subject=body.subject,
        total_marks=body.total_marks,
    )
    db.add(exam)
    await db.flush()
    return ExamResponse.model_validate(exam)


@router.get("/", response_model=list[ExamResponse])
async def list_exams(
    db: AsyncSession = Depends(get_session),
) -> list[ExamResponse]:
    """List all exams."""
    result = await db.execute(select(Exam).order_by(Exam.created_at.desc()))
    exams = result.scalars().all()
    return [ExamResponse.model_validate(e) for e in exams]


@router.get("/{exam_id}", response_model=ExamDetailResponse)
async def get_exam(
    exam_id: str,
    db: AsyncSession = Depends(get_session),
) -> ExamDetailResponse:
    """Get an exam with its questions, answer keys, and rubrics."""
    result = await db.execute(
        select(Exam)
        .where(Exam.id == exam_id)
        .options(
            selectinload(Exam.questions)
            .selectinload(Question.answer_key),
            selectinload(Exam.questions)
            .selectinload(Question.rubrics),
        )
    )
    exam = result.scalar_one_or_none()
    if exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")
    return ExamDetailResponse.model_validate(exam)


@router.patch("/{exam_id}", response_model=ExamResponse)
async def update_exam(
    exam_id: str,
    body: ExamUpdate,
    db: AsyncSession = Depends(get_session),
) -> ExamResponse:
    """Update exam metadata. Only provided fields are changed."""
    exam = await _get_exam_or_404(exam_id, db)

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(exam, field, value)

    await db.flush()
    return ExamResponse.model_validate(exam)


@router.delete("/{exam_id}", status_code=204)
async def delete_exam(
    exam_id: str,
    db: AsyncSession = Depends(get_session),
) -> None:
    """Delete an exam and all its questions, answer keys, and rubrics."""
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")
    await db.delete(exam)


# ---------------------------------------------------------------------------
# Question endpoints
# ---------------------------------------------------------------------------


@router.post("/{exam_id}/questions", response_model=QuestionResponse, status_code=201)
async def add_question(
    exam_id: str,
    body: QuestionCreate,
    db: AsyncSession = Depends(get_session),
) -> QuestionResponse:
    """Add a question to an exam."""
    exam = await _get_exam_or_404(exam_id, db)

    question = Question(
        exam_id=exam.id,
        question_number=body.question_number,
        question_text=body.question_text,
        max_marks=body.max_marks,
    )
    db.add(question)
    await db.flush()
    return QuestionResponse.model_validate(question)


@router.get("/{exam_id}/questions", response_model=list[QuestionResponse])
async def list_questions(
    exam_id: str,
    db: AsyncSession = Depends(get_session),
) -> list[QuestionResponse]:
    """List all questions for an exam."""
    await _get_exam_or_404(exam_id, db)

    result = await db.execute(
        select(Question)
        .where(Question.exam_id == exam_id)
        .order_by(Question.question_number)
    )
    questions = result.scalars().all()
    return [QuestionResponse.model_validate(q) for q in questions]


@router.get(
    "/{exam_id}/questions/{question_id}",
    response_model=QuestionDetailResponse,
)
async def get_question(
    exam_id: str,
    question_id: str,
    db: AsyncSession = Depends(get_session),
) -> QuestionDetailResponse:
    """Get a question with its answer key and rubrics."""
    result = await db.execute(
        select(Question)
        .where(Question.id == question_id, Question.exam_id == exam_id)
        .options(
            selectinload(Question.answer_key),
            selectinload(Question.rubrics),
        )
    )
    question = result.scalar_one_or_none()
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    return QuestionDetailResponse.model_validate(question)


# ---------------------------------------------------------------------------
# Answer key endpoints
# ---------------------------------------------------------------------------


@router.post(
    "/{exam_id}/questions/{question_id}/answer-key",
    response_model=AnswerKeyResponse,
    status_code=201,
)
async def set_answer_key(
    exam_id: str,
    question_id: str,
    body: AnswerKeyCreate,
    db: AsyncSession = Depends(get_session),
) -> AnswerKeyResponse:
    """Set or replace the answer key for a question."""
    await _get_question_or_404(exam_id, question_id, db)

    # Check for existing answer key
    result = await db.execute(
        select(AnswerKey).where(AnswerKey.question_id == question_id)
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.reference_answer = body.reference_answer
        existing.key_concepts = body.key_concepts
        await db.flush()
        return AnswerKeyResponse.model_validate(existing)

    ak = AnswerKey(
        question_id=question_id,
        reference_answer=body.reference_answer,
        key_concepts=body.key_concepts,
    )
    db.add(ak)
    await db.flush()
    return AnswerKeyResponse.model_validate(ak)


# ---------------------------------------------------------------------------
# Rubric endpoints
# ---------------------------------------------------------------------------


@router.post(
    "/{exam_id}/questions/{question_id}/rubrics",
    response_model=RubricResponse,
    status_code=201,
)
async def add_rubric(
    exam_id: str,
    question_id: str,
    body: RubricCreate,
    db: AsyncSession = Depends(get_session),
) -> RubricResponse:
    """Add a rubric criterion to a question."""
    await _get_question_or_404(exam_id, question_id, db)

    rubric = Rubric(
        question_id=question_id,
        criterion=body.criterion,
        description=body.description,
        max_score=body.max_score,
        weight=body.weight,
    )
    db.add(rubric)
    await db.flush()
    return RubricResponse.model_validate(rubric)


@router.get(
    "/{exam_id}/questions/{question_id}/rubrics",
    response_model=list[RubricResponse],
)
async def list_rubrics(
    exam_id: str,
    question_id: str,
    db: AsyncSession = Depends(get_session),
) -> list[RubricResponse]:
    """List all rubric criteria for a question."""
    await _get_question_or_404(exam_id, question_id, db)

    result = await db.execute(
        select(Rubric).where(Rubric.question_id == question_id)
    )
    rubrics = result.scalars().all()
    return [RubricResponse.model_validate(r) for r in rubrics]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _get_exam_or_404(exam_id: str, db: AsyncSession) -> Exam:
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam


async def _get_question_or_404(
    exam_id: str, question_id: str, db: AsyncSession
) -> Question:
    result = await db.execute(
        select(Question).where(
            Question.id == question_id, Question.exam_id == exam_id
        )
    )
    question = result.scalar_one_or_none()
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    return question
