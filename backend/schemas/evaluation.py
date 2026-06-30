"""Pydantic schemas for student submissions and evaluation results."""

from datetime import datetime

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Submission
# ---------------------------------------------------------------------------

class SubmissionCreate(BaseModel):
    """Request body for creating a student submission."""

    document_id: str = Field(description="ID of the uploaded answer sheet")
    exam_id: str = Field(description="ID of the exam being evaluated")
    student_name: str | None = None


class SubmissionResponse(BaseModel):
    """Response schema for a student submission."""

    id: str
    document_id: str
    exam_id: str
    student_name: str | None
    submitted_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Evaluation
# ---------------------------------------------------------------------------

class CriterionScoreResponse(BaseModel):
    """Single criterion score within an evaluation."""

    criterion: str
    score: float
    feedback: str


class EvaluationResponse(BaseModel):
    """Response schema for a single question evaluation."""

    id: int
    submission_id: str
    question_id: str
    extracted_answer: str
    score: float
    max_score: float
    feedback: str
    criterion_scores: list[CriterionScoreResponse] = []
    confidence: float
    evaluated_at: datetime

    model_config = {"from_attributes": True}


class EvaluationSummaryResponse(BaseModel):
    """Summary of all evaluations for a submission."""

    submission_id: str
    student_name: str | None
    exam_id: str
    total_score: float
    max_possible_score: float
    percentage: float
    evaluations: list[EvaluationResponse]


# ---------------------------------------------------------------------------
# Evaluation trigger
# ---------------------------------------------------------------------------

class EvaluateSubmissionRequest(BaseModel):
    """Request body for triggering evaluation of a submission."""

    submission_id: str = Field(description="ID of the student submission to evaluate")


class EvaluateSubmissionResponse(BaseModel):
    """Response returned after evaluation completes."""

    submission_id: str
    status: str
    total_score: float
    max_possible_score: float
    percentage: float
    evaluations: list[EvaluationResponse]
    message: str = "Evaluation completed successfully"


# ---------------------------------------------------------------------------
# Batch evaluation
# ---------------------------------------------------------------------------


class BatchEvaluateRequest(BaseModel):
    """Request body for batch-evaluating multiple submissions."""

    submission_ids: list[str] = Field(
        min_length=1,
        description="List of submission IDs to evaluate",
    )


class BatchSubmissionResult(BaseModel):
    """Evaluation result for a single submission within a batch."""

    submission_id: str
    student_name: str | None
    status: str
    total_score: float
    max_possible_score: float
    percentage: float
    error: str | None = None


class BatchEvaluateResponse(BaseModel):
    """Response returned after batch evaluation completes."""

    total_submissions: int
    successful: int
    failed: int
    results: list[BatchSubmissionResult]
    message: str = "Batch evaluation completed"


class ExamSummaryResponse(BaseModel):
    """Summary report for all submissions in an exam."""

    exam_id: str
    exam_title: str
    total_submissions: int
    average_score: float
    average_percentage: float
    highest_score: float
    lowest_score: float
    highest_percentage: float
    lowest_percentage: float
    total_marks: int
    per_question_summary: list["QuestionSummary"] = []


class QuestionSummary(BaseModel):
    """Summary for a single question across all submissions."""

    question_id: str
    question_number: int
    question_text: str
    max_marks: float
    average_score: float
    average_percentage: float
    submissions_answered: int
    submissions_skipped: int
