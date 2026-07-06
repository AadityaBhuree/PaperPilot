"""Pydantic schemas for PaperPilot."""

from backend.schemas.document import (
    UploadResponse,
    DocumentResponse,
    OCRResultResponse,
    OCRResponse,
)
from backend.schemas.exam import (
    ExamCreate,
    ExamResponse,
    ExamDetailResponse,
    QuestionCreate,
    QuestionResponse,
    QuestionDetailResponse,
    AnswerKeyCreate,
    AnswerKeyResponse,
    RubricCreate,
    RubricResponse,
)
from backend.schemas.evaluation import (
    BatchEvaluateRequest,
    BatchEvaluateResponse,
    BatchSubmissionResult,
    EvaluationResponse,
    EvaluationSummaryResponse,
    EvaluateSubmissionRequest,
    EvaluateSubmissionResponse,
    ExamSummaryResponse,
    QuestionSummary,
    SubmissionCreate,
    SubmissionResponse,
)
from backend.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from backend.schemas.pagination import PaginatedResponse, PaginationParams

__all__ = [
    "UploadResponse",
    "DocumentResponse",
    "OCRResultResponse",
    "OCRResponse",
    "ExamCreate",
    "ExamResponse",
    "ExamDetailResponse",
    "QuestionCreate",
    "QuestionResponse",
    "QuestionDetailResponse",
    "AnswerKeyCreate",
    "AnswerKeyResponse",
    "RubricCreate",
    "RubricResponse",
    "BatchEvaluateRequest",
    "BatchEvaluateResponse",
    "BatchSubmissionResult",
    "EvaluationResponse",
    "EvaluationSummaryResponse",
    "EvaluateSubmissionRequest",
    "EvaluateSubmissionResponse",
    "ExamSummaryResponse",
    "QuestionSummary",
    "SubmissionCreate",
    "SubmissionResponse",
    "RegisterRequest",
    "LoginRequest",
    "TokenResponse",
    "UserResponse",
    "PaginatedResponse",
    "PaginationParams",
]
