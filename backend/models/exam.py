"""ORM models for exams, questions, answer keys, and rubrics."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.models.base import Base


class Exam(Base):
    """Represents an exam with questions and grading criteria."""

    __tablename__ = "exams"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    subject: Mapped[str | None] = mapped_column(String(100), nullable=True)
    total_marks: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc)
    )

    questions: Mapped[list["Question"]] = relationship(
        back_populates="exam", cascade="all, delete-orphan", order_by="Question.question_number"
    )

    def __repr__(self) -> str:
        return f"<Exam {self.title!r} (total_marks={self.total_marks})>"


class Question(Base):
    """A single question within an exam."""

    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    exam_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("exams.id", ondelete="CASCADE")
    )
    question_number: Mapped[int] = mapped_column(Integer)
    question_text: Mapped[str] = mapped_column(Text)
    max_marks: Mapped[int] = mapped_column(Integer)

    exam: Mapped["Exam"] = relationship(back_populates="questions")
    answer_key: Mapped["AnswerKey | None"] = relationship(
        back_populates="question", uselist=False, cascade="all, delete-orphan"
    )
    rubrics: Mapped[list["Rubric"]] = relationship(
        back_populates="question", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Question #{self.question_number} (max_marks={self.max_marks})>"


class AnswerKey(Base):
    """Reference/correct answer for a question."""

    __tablename__ = "answer_keys"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    question_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("questions.id", ondelete="CASCADE"), unique=True
    )
    reference_answer: Mapped[str] = mapped_column(Text)
    key_concepts: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # JSON list of key concepts

    question: Mapped["Question"] = relationship(back_populates="answer_key")

    def __repr__(self) -> str:
        return f"<AnswerKey for question_id={self.question_id!r}>"


class Rubric(Base):
    """Grading rubric criterion for a question."""

    __tablename__ = "rubrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    question_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("questions.id", ondelete="CASCADE")
    )
    criterion: Mapped[str] = mapped_column(String(100))  # e.g. "Content accuracy"
    description: Mapped[str] = mapped_column(Text)  # e.g. "Demonstrates understanding of..."
    max_score: Mapped[float] = mapped_column(Float)
    weight: Mapped[float] = mapped_column(Float, default=1.0)

    question: Mapped["Question"] = relationship(back_populates="rubrics")

    def __repr__(self) -> str:
        return f"<Rubric {self.criterion!r} (max_score={self.max_score})>"
