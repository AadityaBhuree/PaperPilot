"""Pydantic schemas for exams, questions, answer keys, and rubrics."""

from datetime import datetime

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Rubric (base — no dependencies)
# ---------------------------------------------------------------------------

class RubricCreate(BaseModel):
    """Request body for adding a rubric criterion to a question."""

    criterion: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1)
    max_score: float = Field(gt=0)
    weight: float = Field(gt=0, default=1.0)


class RubricResponse(BaseModel):
    """Response schema for a rubric criterion."""

    id: int
    question_id: str
    criterion: str
    description: str
    max_score: float
    weight: float

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Answer Key (base — no dependencies)
# ---------------------------------------------------------------------------

class AnswerKeyCreate(BaseModel):
    """Request body for adding an answer key to a question."""

    reference_answer: str = Field(min_length=1)
    key_concepts: str | None = None


class AnswerKeyResponse(BaseModel):
    """Response schema for an answer key."""

    id: int
    question_id: str
    reference_answer: str
    key_concepts: str | None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Question
# ---------------------------------------------------------------------------

class QuestionCreate(BaseModel):
    """Request body for adding a question to an exam."""

    question_number: int = Field(gt=0)
    question_text: str = Field(min_length=1)
    max_marks: int = Field(gt=0)


class QuestionResponse(BaseModel):
    """Response schema for a question."""

    id: str
    exam_id: str
    question_number: int
    question_text: str
    max_marks: int

    model_config = {"from_attributes": True}


class QuestionDetailResponse(QuestionResponse):
    """Question with nested answer key and rubrics."""

    answer_key: AnswerKeyResponse | None = None
    rubrics: list[RubricResponse] = []


# ---------------------------------------------------------------------------
# Exam
# ---------------------------------------------------------------------------

class ExamCreate(BaseModel):
    """Request body for creating an exam."""

    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    subject: str | None = None
    total_marks: int = Field(gt=0)


class ExamUpdate(BaseModel):
    """Request body for updating exam metadata (PATCH). All fields optional."""

    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    subject: str | None = None
    total_marks: int | None = Field(default=None, gt=0)


class ExamResponse(BaseModel):
    """Response schema for an exam."""

    id: str
    title: str
    description: str | None
    subject: str | None
    total_marks: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ExamDetailResponse(ExamResponse):
    """Exam with nested questions."""

    questions: list[QuestionResponse] = []
