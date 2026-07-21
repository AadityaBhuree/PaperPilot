"""Plagiarism & semantic answer similarity service using sentence-transformers embeddings."""

import logging
import numpy as np
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.evaluation import Evaluation, StudentSubmission
from backend.models.exam import Exam

logger = logging.getLogger(__name__)


async def generate_plagiarism_report(
    exam_id: str,
    user_id: str,
    db: AsyncSession,
    similarity_threshold: float = 0.85,
) -> dict:
    """Compare extracted answers across all student submissions for an exam and flag similar pairs."""
    exam_result = await db.execute(
        select(Exam).where(Exam.id == exam_id, Exam.user_id == user_id)
    )
    exam = exam_result.scalar_one_or_none()
    if not exam:
        return {"error": "Exam not found"}

    sub_result = await db.execute(
        select(StudentSubmission)
        .join(Exam, StudentSubmission.exam_id == Exam.id)
        .where(StudentSubmission.exam_id == exam_id, Exam.user_id == user_id)
    )
    submissions = sub_result.scalars().all()
    if len(submissions) < 2:
        return {
            "exam_title": exam.title,
            "total_submissions": len(submissions),
            "flagged_pairs": [],
            "message": "At least 2 submissions are required to run plagiarism detection.",
        }

    sub_ids = [s.id for s in submissions]
    sub_map = {s.id: s.student_name or f"Submission {s.id[:8]}" for s in submissions}

    eval_result = await db.execute(
        select(Evaluation).where(Evaluation.submission_id.in_(sub_ids))
    )
    evaluations = eval_result.scalars().all()

    # Combine extracted answers per submission
    answers_by_sub: dict[str, str] = {}
    for sub_id in sub_ids:
        sub_evals = [e for e in evaluations if e.submission_id == sub_id]
        combined = " ".join([e.extracted_answer for e in sub_evals if e.extracted_answer.strip()])
        answers_by_sub[sub_id] = combined

    valid_subs = [sid for sid, text in answers_by_sub.items() if len(text.split()) > 5]
    if len(valid_subs) < 2:
        return {
            "exam_title": exam.title,
            "total_submissions": len(submissions),
            "flagged_pairs": [],
            "message": "Insufficient answer text available across submissions for comparison.",
        }

    flagged_pairs = []
    try:
        from sentence_transformers import SentenceTransformer
        embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        texts = [answers_by_sub[sid] for sid in valid_subs]
        embeddings = embedder.encode(texts, normalize_embeddings=True)

        # Compute cosine similarity matrix
        for i in range(len(valid_subs)):
            for j in range(i + 1, len(valid_subs)):
                sim = float(np.dot(embeddings[i], embeddings[j]))
                if sim >= similarity_threshold:
                    flagged_pairs.append({
                        "submission_a": valid_subs[i],
                        "student_a": sub_map[valid_subs[i]],
                        "submission_b": valid_subs[j],
                        "student_b": sub_map[valid_subs[j]],
                        "similarity_score": round(sim, 3),
                        "percentage": round(sim * 100, 1),
                    })
    except Exception as exc:
        logger.error("SentenceTransformer plagiarism embedding failed: %s", exc)
        return {
            "exam_title": exam.title,
            "total_submissions": len(submissions),
            "flagged_pairs": [],
            "error": str(exc),
        }

    return {
        "exam_title": exam.title,
        "total_submissions": len(submissions),
        "similarity_threshold": similarity_threshold,
        "flagged_count": len(flagged_pairs),
        "flagged_pairs": sorted(flagged_pairs, key=lambda x: x["similarity_score"], reverse=True),
    }
