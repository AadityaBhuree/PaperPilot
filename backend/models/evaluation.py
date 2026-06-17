"""ORM models for student submissions and evaluation results."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.models.base import Base


class StudentSubmission(Base):
    """Links a student's uploaded document to an exam for evaluation."""

    __tablename__ = "student_submissions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    document_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("uploaded_documents.id", ondelete="CASCADE")
    )
    exam_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("exams.id", ondelete="CASCADE")
    )
    student_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc)
    )

    document: Mapped["UploadedDocument"] = relationship(
        foreign_keys=[document_id],
    )

    evaluations: Mapped[list["Evaluation"]] = relationship(
        back_populates="submission", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<StudentSubmission {self.student_name!r} exam={self.exam_id!r}>"


class Evaluation(Base):
    """Per-question grading result for a student submission."""

    __tablename__ = "evaluations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    submission_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("student_submissions.id", ondelete="CASCADE")
    )
    question_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("questions.id", ondelete="CASCADE")
    )
    extracted_answer: Mapped[str] = mapped_column(Text)
    score: Mapped[float] = mapped_column(Float)
    max_score: Mapped[float] = mapped_column(Float)
    feedback: Mapped[str] = mapped_column(Text)
    criterion_scores: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # JSON: {"criterion": {"score": x, "feedback": "..."}}
    confidence: Mapped[float] = mapped_column(Float)
    evaluated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc)
    )

    submission: Mapped["StudentSubmission"] = relationship(back_populates="evaluations")

    def __repr__(self) -> str:
        return f"<Evaluation question={self.question_id!r} score={self.score}/{self.max_score}>"
