"""Tests for the evaluation API endpoints with mocked LLM services."""

import json
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio


# ---------------------------------------------------------------------------
# Mock return values for the LLM pipeline
# ---------------------------------------------------------------------------

MOCK_QUESTIONS = [
    {"question_number": 1, "question_text": "Explain the fundamental theorem of calculus."}
]

MOCK_ANSWERS = [
    {"question_number": 1, "answer_text": "It connects differentiation and integration."}
]

MOCK_EVAL_RESULT = {
    "score": 8.0,
    "max_score": 10.0,
    "feedback": "Good answer covering the main concept.",
    "confidence": 0.9,
    "criterion_scores": json.dumps([
        {"criterion": "Content Accuracy", "score": 8.0, "feedback": "Accurate description"}
    ]),
}


@pytest.mark.asyncio
async def test_create_submission(client, sample_document, sample_exam):
    response = await client.post("/api/evaluation/submissions", json={
        "document_id": sample_document.id,
        "exam_id": sample_exam.id,
        "student_name": "Alice",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["student_name"] == "Alice"
    assert data["exam_id"] == sample_exam.id


@pytest.mark.asyncio
async def test_create_submission_document_not_found(client, sample_exam):
    response = await client.post("/api/evaluation/submissions", json={
        "document_id": "nonexistent",
        "exam_id": sample_exam.id,
    })
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_submission_exam_not_found(client, sample_document):
    response = await client.post("/api/evaluation/submissions", json={
        "document_id": sample_document.id,
        "exam_id": "nonexistent",
    })
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_submission(client, sample_document, sample_exam):
    # Create a submission
    create_resp = await client.post("/api/evaluation/submissions", json={
        "document_id": sample_document.id,
        "exam_id": sample_exam.id,
    })
    sub_id = create_resp.json()["id"]

    # Get it
    response = await client.get(f"/api/evaluation/submissions/{sub_id}")
    assert response.status_code == 200
    assert response.json()["id"] == sub_id


@pytest.mark.asyncio
async def test_get_submission_not_found(client):
    response = await client.get("/api/evaluation/submissions/nonexistent")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_submissions_for_exam(client, sample_document, sample_exam):
    # Create a submission
    await client.post("/api/evaluation/submissions", json={
        "document_id": sample_document.id,
        "exam_id": sample_exam.id,
        "student_name": "Alice",
    })

    response = await client.get(f"/api/evaluation/exams/{sample_exam.id}/submissions")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert data["items"][0]["student_name"] == "Alice"


@pytest.mark.asyncio
@patch("backend.services.evaluator_service.evaluate_answer", new_callable=AsyncMock)
@patch("backend.services.evaluator_service.detect_questions", new_callable=AsyncMock)
@patch("backend.services.evaluator_service.extract_answers", new_callable=AsyncMock)
async def test_evaluate_submission(
    mock_extract,
    mock_detect,
    mock_evaluate,
    client,
    sample_document,
    sample_exam,
    sample_question,
    sample_answer_key,
    sample_rubric,
):
    mock_detect.return_value = MOCK_QUESTIONS
    mock_extract.return_value = MOCK_ANSWERS
    mock_evaluate.return_value = MOCK_EVAL_RESULT

    # Create submission
    create_resp = await client.post("/api/evaluation/submissions", json={
        "document_id": sample_document.id,
        "exam_id": sample_exam.id,
    })
    sub_id = create_resp.json()["id"]

    # Evaluate
    response = await client.post(f"/api/evaluation/submissions/{sub_id}/evaluate")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert data["total_score"] == 8.0
    assert len(data["evaluations"]) == 1

    # Verify mocks were called
    mock_detect.assert_called_once()
    mock_extract.assert_called_once()
    mock_evaluate.assert_called_once()


@pytest.mark.asyncio
@patch("backend.services.evaluator_service.evaluate_answer", new_callable=AsyncMock)
@patch("backend.services.evaluator_service.detect_questions", new_callable=AsyncMock)
@patch("backend.services.evaluator_service.extract_answers", new_callable=AsyncMock)
async def test_get_evaluation_results(
    mock_extract,
    mock_detect,
    mock_evaluate,
    client,
    sample_document,
    sample_exam,
    sample_question,
    sample_answer_key,
    sample_rubric,
):
    mock_detect.return_value = MOCK_QUESTIONS
    mock_extract.return_value = MOCK_ANSWERS
    mock_evaluate.return_value = MOCK_EVAL_RESULT

    # Create and evaluate
    create_resp = await client.post("/api/evaluation/submissions", json={
        "document_id": sample_document.id,
        "exam_id": sample_exam.id,
    })
    sub_id = create_resp.json()["id"]
    await client.post(f"/api/evaluation/submissions/{sub_id}/evaluate")

    # Get results
    response = await client.get(f"/api/evaluation/submissions/{sub_id}/results")
    assert response.status_code == 200
    data = response.json()
    assert data["total_score"] == 8.0
    assert data["percentage"] == 80.0


@pytest.mark.asyncio
@patch("backend.services.evaluator_service.evaluate_answer", new_callable=AsyncMock)
@patch("backend.services.evaluator_service.detect_questions", new_callable=AsyncMock)
@patch("backend.services.evaluator_service.extract_answers", new_callable=AsyncMock)
async def test_batch_evaluate(
    mock_extract,
    mock_detect,
    mock_evaluate,
    client,
    sample_document,
    sample_exam,
    sample_question,
    sample_answer_key,
    sample_rubric,
):
    mock_detect.return_value = MOCK_QUESTIONS
    mock_extract.return_value = MOCK_ANSWERS
    mock_evaluate.return_value = MOCK_EVAL_RESULT

    # Create two submissions
    sub_ids = []
    for name in ["Alice", "Bob"]:
        resp = await client.post("/api/evaluation/submissions", json={
            "document_id": sample_document.id,
            "exam_id": sample_exam.id,
            "student_name": name,
        })
        sub_ids.append(resp.json()["id"])

    # Batch evaluate
    response = await client.post("/api/evaluation/batch-evaluate", json={
        "submission_ids": sub_ids,
    })
    assert response.status_code == 200
    data = response.json()
    assert data["total_submissions"] == 2
    assert data["successful"] == 2
    assert data["failed"] == 0
    assert len(data["results"]) == 2


@pytest.mark.asyncio
@patch("backend.services.evaluator_service.evaluate_answer", new_callable=AsyncMock)
@patch("backend.services.evaluator_service.detect_questions", new_callable=AsyncMock)
@patch("backend.services.evaluator_service.extract_answers", new_callable=AsyncMock)
async def test_batch_evaluate_with_failure(
    mock_extract,
    mock_detect,
    mock_evaluate,
    client,
    sample_document,
    sample_exam,
    sample_question,
    sample_answer_key,
    sample_rubric,
):
    mock_detect.return_value = MOCK_QUESTIONS
    mock_extract.return_value = MOCK_ANSWERS
    mock_evaluate.return_value = MOCK_EVAL_RESULT

    # Create one valid submission
    resp = await client.post("/api/evaluation/submissions", json={
        "document_id": sample_document.id,
        "exam_id": sample_exam.id,
    })
    valid_id = resp.json()["id"]

    # Batch with one valid and one nonexistent
    response = await client.post("/api/evaluation/batch-evaluate", json={
        "submission_ids": [valid_id, "nonexistent-id"],
    })
    assert response.status_code == 200
    data = response.json()
    assert data["total_submissions"] == 2
    assert data["successful"] == 1
    assert data["failed"] == 1
    assert data["results"][1]["error"] is not None


@pytest.mark.asyncio
async def test_list_submissions_for_exam(client, sample_document, sample_exam):
    # Create a submission
    await client.post("/api/evaluation/submissions", json={
        "document_id": sample_document.id,
        "exam_id": sample_exam.id,
    })

    response = await client.get(f"/api/evaluation/exams/{sample_exam.id}/submissions")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_exam_summary_empty(client, sample_exam):
    response = await client.get(f"/api/evaluation/exams/{sample_exam.id}/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_submissions"] == 0


@pytest.mark.asyncio
@patch("backend.services.evaluator_service.evaluate_answer", new_callable=AsyncMock)
@patch("backend.services.evaluator_service.detect_questions", new_callable=AsyncMock)
@patch("backend.services.evaluator_service.extract_answers", new_callable=AsyncMock)
async def test_exam_summary_with_evaluations(
    mock_extract,
    mock_detect,
    mock_evaluate,
    client,
    sample_document,
    sample_exam,
    sample_question,
    sample_answer_key,
    sample_rubric,
):
    mock_detect.return_value = MOCK_QUESTIONS
    mock_extract.return_value = MOCK_ANSWERS
    mock_evaluate.return_value = MOCK_EVAL_RESULT

    # Create and evaluate
    resp = await client.post("/api/evaluation/submissions", json={
        "document_id": sample_document.id,
        "exam_id": sample_exam.id,
        "student_name": "Alice",
    })
    sub_id = resp.json()["id"]
    await client.post(f"/api/evaluation/submissions/{sub_id}/evaluate")

    # Get summary
    response = await client.get(f"/api/evaluation/exams/{sample_exam.id}/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_submissions"] == 1
    assert data["average_score"] == 8.0
    assert data["highest_score"] == 8.0
    assert len(data["per_question_summary"]) == 1
