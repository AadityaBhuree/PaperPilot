"""ORM models for PaperPilot."""

from backend.models.base import Base
from backend.models.document import UploadedDocument, OCRResult
from backend.models.exam import Exam, Question, AnswerKey, Rubric
from backend.models.evaluation import StudentSubmission, Evaluation

__all__ = [
    "Base",
    "UploadedDocument",
    "OCRResult",
    "Exam",
    "Question",
    "AnswerKey",
    "Rubric",
    "StudentSubmission",
    "Evaluation",
]
