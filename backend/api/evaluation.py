"""API routes for triggering and retrieving evaluation results."""

import csv
import io
import json
import logging
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.database.connection import get_session
from backend.models.document import DocumentStatus, OCRResult, UploadedDocument
from backend.models.user import User
from backend.services.auth_service import get_current_user
from backend.models.evaluation import Evaluation, StudentSubmission
from backend.models.exam import Exam, Question
from backend.schemas.evaluation import (
    BatchEvaluateRequest,
    BatchEvaluateResponse,
    BatchSubmissionResult,
    CriterionScoreResponse,
    EvaluationResponse,
    EvaluationSummaryResponse,
    EvaluateSubmissionResponse,
    ExamSummaryResponse,
    QuestionSummary,
    SubmissionCreate,
    SubmissionResponse,
)
from backend.schemas.pagination import PaginatedResponse, PaginationParams, build_paginated_response
from backend.services.evaluator_service import run_evaluation, to_eval_response

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/evaluation", tags=["evaluation"])


# ---------------------------------------------------------------------------
# Submission endpoints
# ---------------------------------------------------------------------------


@router.post("/submissions", response_model=SubmissionResponse, status_code=201)
async def create_submission(
    body: SubmissionCreate,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> SubmissionResponse:
    """Create a student submission linking a document to an exam."""
    doc_result = await db.execute(
        select(UploadedDocument).where(UploadedDocument.id == body.document_id, UploadedDocument.user_id == user.id)
    )
    doc = doc_result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")

    exam_result = await db.execute(select(Exam).where(Exam.id == body.exam_id, Exam.user_id == user.id))
    exam = exam_result.scalar_one_or_none()
    if exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")

    submission = StudentSubmission(
        document_id=body.document_id,
        exam_id=body.exam_id,
        student_name=body.student_name,
    )
    db.add(submission)
    await db.flush()
    return SubmissionResponse.model_validate(submission)


@router.get(
    "/submissions/{submission_id}",
    response_model=SubmissionResponse,
)
async def get_submission(
    submission_id: str,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> SubmissionResponse:
    """Get a student submission."""
    result = await db.execute(
        select(StudentSubmission).join(Exam, StudentSubmission.exam_id == Exam.id).where(StudentSubmission.id == submission_id, Exam.user_id == user.id)
    )
    sub = result.scalar_one_or_none()
    if sub is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    return SubmissionResponse.model_validate(sub)


# ---------------------------------------------------------------------------
# Global submissions endpoint (across all exams)
# ---------------------------------------------------------------------------


@router.get(
    "/submissions",
    response_model=PaginatedResponse[SubmissionResponse],
)
async def list_all_submissions(
    p: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> PaginatedResponse[SubmissionResponse]:
    """List all student submissions across all exams with pagination."""
    count_result = await db.execute(
        select(func.count()).select_from(StudentSubmission).join(Exam, StudentSubmission.exam_id == Exam.id).where(Exam.user_id == user.id)
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        select(StudentSubmission)
        .join(Exam, StudentSubmission.exam_id == Exam.id)
        .where(Exam.user_id == user.id)
        .order_by(StudentSubmission.submitted_at.desc())
        .offset(p.offset)
        .limit(p.page_size)
    )
    subs = result.scalars().all()
    items = [SubmissionResponse.model_validate(s) for s in subs]

    return build_paginated_response(items, total, p)


@router.get(
    "/exams/{exam_id}/submissions",
    response_model=PaginatedResponse[SubmissionResponse],
)
async def list_submissions_for_exam(
    exam_id: str,
    p: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> PaginatedResponse[SubmissionResponse]:
    """List submissions for a given exam with pagination."""
    count_result = await db.execute(
        select(func.count())
        .select_from(StudentSubmission)
        .join(Exam, StudentSubmission.exam_id == Exam.id)
        .where(StudentSubmission.exam_id == exam_id, Exam.user_id == user.id)
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        select(StudentSubmission)
        .join(Exam, StudentSubmission.exam_id == Exam.id)
        .where(StudentSubmission.exam_id == exam_id, Exam.user_id == user.id)
        .order_by(StudentSubmission.submitted_at.desc())
        .offset(p.offset)
        .limit(p.page_size)
    )
    subs = result.scalars().all()
    items = [SubmissionResponse.model_validate(s) for s in subs]

    return build_paginated_response(items, total, p)


# ---------------------------------------------------------------------------
# Single evaluate endpoint
# ---------------------------------------------------------------------------


@router.post(
    "/submissions/{submission_id}/evaluate",
    response_model=EvaluateSubmissionResponse,
)
async def evaluate_submission(
    submission_id: str,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> EvaluateSubmissionResponse:
    """Run the full evaluation pipeline on a single student submission."""
    return await run_evaluation(submission_id, db)


# ---------------------------------------------------------------------------
# Batch evaluate endpoint
# ---------------------------------------------------------------------------


@router.post("/batch-evaluate", response_model=BatchEvaluateResponse)
async def batch_evaluate(
    body: BatchEvaluateRequest,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> BatchEvaluateResponse:
    """Evaluate multiple submissions in one request.

    Each submission is evaluated independently. Failures are captured
    per-submission so that one failure does not abort the entire batch.
    """
    results: list[BatchSubmissionResult] = []
    successful = 0
    failed = 0

    for sid in body.submission_ids:
        try:
            eval_resp = await run_evaluation(sid, db)

            # Fetch student name
            sub_result = await db.execute(
                select(StudentSubmission).join(Exam, StudentSubmission.exam_id == Exam.id).where(StudentSubmission.id == sid, Exam.user_id == user.id)
            )
            sub = sub_result.scalar_one_or_none()
            student_name = sub.student_name if sub else None

            results.append(
                BatchSubmissionResult(
                    submission_id=sid,
                    student_name=student_name,
                    status="completed",
                    total_score=eval_resp.total_score,
                    max_possible_score=eval_resp.max_possible_score,
                    percentage=eval_resp.percentage,
                )
            )
            successful += 1
        except Exception as exc:
            logger.error("Batch evaluation failed for submission %s: %s", sid, exc)
            results.append(
                BatchSubmissionResult(
                    submission_id=sid,
                    student_name=None,
                    status="failed",
                    total_score=0.0,
                    max_possible_score=0.0,
                    percentage=0.0,
                    error=str(exc),
                )
            )
            failed += 1

    return BatchEvaluateResponse(
        total_submissions=len(body.submission_ids),
        successful=successful,
        failed=failed,
        results=results,
    )


# ---------------------------------------------------------------------------
# Exam summary report
# ---------------------------------------------------------------------------


from backend.services.evaluation_service import generate_exam_summary_service, generate_gradebook_csv_bytes
from backend.services.report_service import generate_class_remediation_insights

@router.get("/exams/{exam_id}/remediation")
async def get_exam_remediation_insights(
    exam_id: str,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """Generate AI class weakness and remediation insights."""
    insights = await generate_class_remediation_insights(exam_id, user.id, db)
    if "error" in insights:
        raise HTTPException(status_code=404, detail=insights["error"])
    return insights


@router.get(
    "/exams/{exam_id}/summary",
    response_model=ExamSummaryResponse,
)
async def get_exam_summary(
    exam_id: str,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> ExamSummaryResponse:
    """Generate a summary report for all evaluated submissions in an exam."""
    summary = await generate_exam_summary_service(exam_id, user.id, db)
    if summary is None:
        raise HTTPException(status_code=404, detail="Exam not found")
    return summary


# ---------------------------------------------------------------------------
# Results endpoint
# ---------------------------------------------------------------------------


@router.get(
    "/submissions/{submission_id}/results",
    response_model=EvaluationSummaryResponse,
)
async def get_evaluation_results(
    submission_id: str,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> EvaluationSummaryResponse:
    """Get evaluation results for a submission."""
    sub_result = await db.execute(
        select(StudentSubmission).join(Exam, StudentSubmission.exam_id == Exam.id).where(StudentSubmission.id == submission_id, Exam.user_id == user.id)
    )
    submission = sub_result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=404, detail="Submission not found")

    eval_result = await db.execute(
        select(Evaluation)
        .where(Evaluation.submission_id == submission_id)
        .order_by(Evaluation.id)
    )
    evaluations = eval_result.scalars().all()

    total_score = sum(e.score for e in evaluations)
    max_possible = sum(e.max_score for e in evaluations)
    percentage = (total_score / max_possible * 100) if max_possible > 0 else 0.0

    return EvaluationSummaryResponse(
        submission_id=submission.id,
        student_name=submission.student_name,
        exam_id=submission.exam_id,
        total_score=total_score,
        max_possible_score=max_possible,
        percentage=round(percentage, 2),
        evaluations=[to_eval_response(e) for e in evaluations],
    )


@router.get("/exams/{exam_id}/export/csv")
async def export_exam_csv(
    exam_id: str,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """Export exam evaluation results as a CSV file."""
    output, exam = await generate_gradebook_csv_bytes(exam_id, user.id, db)
    if output is None or exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=exam_{exam_id}_results.csv"}
    )
