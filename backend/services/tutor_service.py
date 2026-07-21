"""PilotBot AI Tutor service for answering student queries about evaluated answers."""

import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.evaluation import Evaluation, StudentSubmission
from backend.models.exam import AnswerKey, Question
from backend.services.ai_config import get_llm

logger = logging.getLogger(__name__)


async def chat_with_pilotbot(
    evaluation_id: int,
    user_query: str,
    db: AsyncSession,
) -> dict:
    """Answer student questions about score deductions and how to earn full marks."""
    eval_result = await db.execute(
        select(Evaluation).where(Evaluation.id == evaluation_id)
    )
    ev = eval_result.scalar_one_or_none()
    if not ev:
        return {"error": "Evaluation not found"}

    q_result = await db.execute(
        select(Question).where(Question.id == ev.question_id)
    )
    question = q_result.scalar_one_or_none()

    ak_result = await db.execute(
        select(AnswerKey).where(AnswerKey.question_id == ev.question_id)
    )
    ak = ak_result.scalar_one_or_none()

    reference_text = ak.reference_answer if ak else "N/A"
    question_prompt = question.question_text if question else "N/A"

    prompt = (
        f"You are PilotBot, a patient and encouraging AI academic tutor for PaperPilot.\n"
        f"The student received a score of {ev.score}/{ev.max_score} on Question:\n"
        f"Prompt: \"{question_prompt}\"\n"
        f"Student Answer: \"{ev.extracted_answer}\"\n"
        f"Reference Answer: \"{reference_text}\"\n"
        f"Original AI Feedback: \"{ev.feedback}\"\n\n"
        f"Student Query: \"{user_query}\"\n\n"
        f"Provide a helpful, concise, and constructive tutoring explanation (under 150 words). "
        f"Explain specifically why points were deducted and give actionable tips on how to structure a full-mark response."
    )

    try:
        llm = get_llm(temperature=0.3)
        response = await llm.ainvoke(prompt)
        reply = response.content if hasattr(response, "content") else str(response)
        return {
            "evaluation_id": evaluation_id,
            "user_query": user_query,
            "pilotbot_reply": reply.strip(),
        }
    except Exception as exc:
        logger.error("PilotBot AI tutor chat failed: %s", exc)
        return {
            "evaluation_id": evaluation_id,
            "user_query": user_query,
            "pilotbot_reply": "PilotBot is currently unavailable. Please review the criterion breakdown or contact your instructor.",
        }
