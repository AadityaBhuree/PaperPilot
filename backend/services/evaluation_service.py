"""Evaluation domain service for orchestrating scoring, batch calculations, summary reports, and gradebook exports."""

import csv
import io
import logging
from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.models.evaluation import Evaluation, StudentSubmission
from backend.models.exam import Exam, Question
from backend.schemas.evaluation import (
    ExamSummaryResponse,
    QuestionSummary,
)

logger = logging.getLogger(__name__)


async def generate_exam_summary_service(
    exam_id: str,
    user_id: str,
    db: AsyncSession,
) -> ExamSummaryResponse | None:
    """Generate summary statistics for an exam owned by user_id."""
    exam_result = await db.execute(
        select(Exam)
        .where(Exam.id == exam_id, Exam.user_id == user_id)
        .options(
            selectinload(Exam.questions).selectinload(Question.rubrics),
        )
    )
    exam = exam_result.scalar_one_or_none()
    if exam is None:
        return None

    sub_result = await db.execute(
        select(StudentSubmission)
        .join(Exam, StudentSubmission.exam_id == Exam.id)
        .where(StudentSubmission.exam_id == exam_id, Exam.user_id == user_id)
    )
    submissions = sub_result.scalars().all()

    if not submissions:
        return ExamSummaryResponse(
            exam_id=exam.id,
            exam_title=exam.title,
            total_submissions=0,
            average_score=0.0,
            average_percentage=0.0,
            highest_score=0.0,
            lowest_score=0.0,
            highest_percentage=0.0,
            lowest_percentage=0.0,
            total_marks=exam.total_marks,
            per_question_summary=[],
        )

    sub_ids = [s.id for s in submissions]
    eval_result = await db.execute(
        select(Evaluation).where(Evaluation.submission_id.in_(sub_ids))
    )
    evaluations = eval_result.scalars().all()

    sub_totals: dict[str, list[float]] = defaultdict(lambda: [0.0, 0.0])
    for ev in evaluations:
        sub_totals[ev.submission_id][0] += ev.score
        sub_totals[ev.submission_id][1] += ev.max_score

    percentages = [
        (s / m * 100) if m > 0 else 0.0 for s, m in sub_totals.values()
    ]
    total_scores = [s for s, _ in sub_totals.values()]

    question_data: dict[str, dict] = {}
    for q in exam.questions:
        question_data[q.id] = {
            "question_number": q.question_number,
            "question_text": q.question_text,
            "max_marks": float(q.max_marks),
            "scores": [],
            "answered": 0,
            "skipped": 0,
        }

    for ev in evaluations:
        qd = question_data.get(ev.question_id)
        if qd:
            qd["scores"].append(ev.score)
            if ev.extracted_answer.strip():
                qd["answered"] += 1
            else:
                qd["skipped"] += 1

    per_question_summary = []
    for q in exam.questions:
        qd = question_data[q.id]
        scores = qd["scores"]
        avg = sum(scores) / len(scores) if scores else 0.0
        max_m = qd["max_marks"]
        per_question_summary.append(
            QuestionSummary(
                question_id=q.id,
                question_number=qd["question_number"],
                question_text=qd["question_text"],
                max_marks=max_m,
                average_score=round(avg, 2),
                average_percentage=round((avg / max_m * 100) if max_m > 0 else 0.0, 2),
                submissions_answered=qd["answered"],
                submissions_skipped=qd["skipped"],
            )
        )

    return ExamSummaryResponse(
        exam_id=exam.id,
        exam_title=exam.title,
        total_submissions=len(submissions),
        average_score=round(sum(total_scores) / len(total_scores), 2) if total_scores else 0.0,
        average_percentage=round(sum(percentages) / len(percentages), 2) if percentages else 0.0,
        highest_score=round(max(total_scores), 2) if total_scores else 0.0,
        lowest_score=round(min(total_scores), 2) if total_scores else 0.0,
        highest_percentage=round(max(percentages), 2) if percentages else 0.0,
        lowest_percentage=round(min(percentages), 2) if percentages else 0.0,
        total_marks=exam.total_marks,
        per_question_summary=per_question_summary,
    )


async def generate_gradebook_csv_bytes(
    exam_id: str,
    user_id: str,
    db: AsyncSession,
) -> tuple[io.StringIO, Exam] | tuple[None, None]:
    """Generate CSV StringIO buffer for gradebook export."""
    exam_result = await db.execute(
        select(Exam)
        .where(Exam.id == exam_id, Exam.user_id == user_id)
        .options(selectinload(Exam.questions))
    )
    exam = exam_result.scalar_one_or_none()
    if exam is None:
        return None, None

    questions = sorted(exam.questions, key=lambda q: q.question_number)

    sub_result = await db.execute(
        select(StudentSubmission)
        .join(Exam, StudentSubmission.exam_id == Exam.id)
        .where(StudentSubmission.exam_id == exam_id, Exam.user_id == user_id)
        .order_by(StudentSubmission.submitted_at)
    )
    submissions = sub_result.scalars().all()
    sub_ids = [s.id for s in submissions]

    evals_by_sub = defaultdict(dict)
    if sub_ids:
        eval_result = await db.execute(
            select(Evaluation).where(Evaluation.submission_id.in_(sub_ids))
        )
        for ev in eval_result.scalars().all():
            evals_by_sub[ev.submission_id][ev.question_id] = ev.score

    output = io.StringIO()
    writer = csv.writer(output)
    
    header = ["Submission ID", "Student Name", "Total Score", "Percentage"]
    for q in questions:
        header.append(f"Q{q.question_number} Score")
    writer.writerow(header)

    for sub in submissions:
        row = [sub.id, sub.student_name or "Unknown"]
        evals = evals_by_sub.get(sub.id, {})
        total_score = sum(evals.values())
        percentage = (total_score / exam.total_marks * 100) if exam.total_marks > 0 else 0.0
        
        row.extend([round(total_score, 2), round(percentage, 2)])
        for q in questions:
            row.append(round(evals.get(q.id, 0.0), 2))
        
        writer.writerow(row)

    output.seek(0)
    return output, exam
