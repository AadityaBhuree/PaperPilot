"""Service for generating AI class remediation insights and diagnostic reports."""

import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.models.evaluation import Evaluation, StudentSubmission
from backend.models.exam import Exam, Question
from backend.services.ai_config import get_llm

logger = logging.getLogger(__name__)


async def generate_class_remediation_insights(
    exam_id: str,
    user_id: str,
    db: AsyncSession,
) -> dict:
    """Analyze class-wide rubric performance using Gemini 1.5 to output weak topics & practice recommendations."""
    exam_result = await db.execute(
        select(Exam)
        .where(Exam.id == exam_id, Exam.user_id == user_id)
        .options(selectinload(Exam.questions).selectinload(Question.rubrics))
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
    sub_ids = [s.id for s in submissions]

    if not sub_ids:
        return {
            "exam_title": exam.title,
            "weak_topics": [],
            "recommendations": ["No evaluations available yet for remediation analysis."],
        }

    eval_result = await db.execute(
        select(Evaluation).where(Evaluation.submission_id.in_(sub_ids))
    )
    evaluations = eval_result.scalars().all()

    # Aggregate low-scoring questions (score < 60% of max)
    low_scoring_summary = []
    for q in exam.questions:
        q_evals = [e for e in evaluations if e.question_id == q.id]
        if q_evals:
            avg_score = sum(e.score for e in q_evals) / len(q_evals)
            percentage = (avg_score / q.max_marks * 100) if q.max_marks > 0 else 0.0
            if percentage < 70.0:
                low_scoring_summary.append(
                    f"Question #{q.question_number} ('{q.question_text[:100]}'): Class average {avg_score:.1f}/{q.max_marks} ({percentage:.1f}%)"
                )

    if not low_scoring_summary:
        return {
            "exam_title": exam.title,
            "weak_topics": ["Class demonstrated high proficiency across all questions."],
            "recommendations": ["Advance to higher-order conceptual applications."],
        }

    prompt = (
        f"You are an expert curriculum consultant analyzing exam performance for '{exam.title}'.\n"
        f"Here are the low-scoring questions where students struggled:\n"
        + "\n".join(low_scoring_summary)
        + "\n\n"
        + "Provide a JSON object with two keys:\n"
        + '1. "weak_topics": list of 2-3 specific conceptual topics students failed to grasp.\n'
        + '2. "recommendations": list of 2-3 actionable remediation steps or practice prompts for the teacher.\n'
        + "Return ONLY valid JSON."
    )

    try:
        llm = get_llm(temperature=0.2)
        response = await llm.ainvoke(prompt)
        text = response.content if hasattr(response, "content") else str(response)
        
        # Clean JSON markdown fences if present
        cleaned_text = text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:]
        if cleaned_text.startswith("```"):
            cleaned_text = cleaned_text[3:]
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]
        
        import json
        parsed = json.loads(cleaned_text.strip())
        parsed["exam_title"] = exam.title
        return parsed
    except Exception as exc:
        logger.error("Remediation LLM generation failed: %s", exc)
        return {
            "exam_title": exam.title,
            "weak_topics": ["Review questions with score average below 70%."],
            "recommendations": ["Provide supplementary reference material and practice problems."],
        }
