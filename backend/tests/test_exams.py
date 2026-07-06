"""Tests for the exams API endpoints."""

import pytest
import pytest_asyncio


@pytest.mark.asyncio
async def test_create_exam(client):
    response = await client.post("/api/exams/", json={
        "title": "Final Exam",
        "description": "End of term",
        "subject": "Physics",
        "total_marks": 50,
    })
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Final Exam"
    assert data["subject"] == "Physics"
    assert data["total_marks"] == 50
    assert "id" in data


@pytest.mark.asyncio
async def test_create_exam_validation(client):
    response = await client.post("/api/exams/", json={
        "title": "",
        "total_marks": 0,
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_exams(client, sample_exam):
    response = await client.get("/api/exams/")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert data["items"][0]["title"] == "Midterm Exam"
    assert data["page"] == 1
    assert data["total_pages"] >= 1


@pytest.mark.asyncio
async def test_get_exam(client, sample_exam):
    response = await client.get(f"/api/exams/{sample_exam.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Midterm Exam"
    assert data["total_marks"] == 20


@pytest.mark.asyncio
async def test_get_exam_not_found(client):
    response = await client.get("/api/exams/nonexistent")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_exam(client, sample_exam):
    response = await client.patch(f"/api/exams/{sample_exam.id}", json={
        "title": "Updated Title",
        "total_marks": 30,
    })
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["total_marks"] == 30


@pytest.mark.asyncio
async def test_update_exam_partial(client, sample_exam):
    response = await client.patch(f"/api/exams/{sample_exam.id}", json={
        "title": "Partially Updated",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Partially Updated"
    assert data["total_marks"] == 20  # unchanged


@pytest.mark.asyncio
async def test_delete_exam(client, sample_exam):
    response = await client.delete(f"/api/exams/{sample_exam.id}")
    assert response.status_code == 204

    # Verify deletion
    response = await client.get(f"/api/exams/{sample_exam.id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_add_question(client, sample_exam):
    response = await client.post(f"/api/exams/{sample_exam.id}/questions", json={
        "question_number": 1,
        "question_text": "What is 2+2?",
        "max_marks": 5,
    })
    assert response.status_code == 201
    data = response.json()
    assert data["question_text"] == "What is 2+2?"
    assert data["max_marks"] == 5


@pytest.mark.asyncio
async def test_list_questions(client, sample_exam, sample_question):
    response = await client.get(f"/api/exams/{sample_exam.id}/questions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_get_question_detail(client, sample_exam, sample_question, sample_rubric):
    response = await client.get(
        f"/api/exams/{sample_exam.id}/questions/{sample_question.id}"
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["rubrics"]) >= 1


@pytest.mark.asyncio
async def test_set_answer_key(client, sample_exam, sample_question):
    response = await client.post(
        f"/api/exams/{sample_exam.id}/questions/{sample_question.id}/answer-key",
        json={
            "reference_answer": "The answer is 42.",
            "key_concepts": "basic arithmetic",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["reference_answer"] == "The answer is 42."


@pytest.mark.asyncio
async def test_add_rubric(client, sample_exam, sample_question):
    response = await client.post(
        f"/api/exams/{sample_exam.id}/questions/{sample_question.id}/rubrics",
        json={
            "criterion": "Grammar",
            "description": "Proper use of language",
            "max_score": 5.0,
            "weight": 1.0,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["criterion"] == "Grammar"


@pytest.mark.asyncio
async def test_list_rubrics(client, sample_exam, sample_question, sample_rubric):
    response = await client.get(
        f"/api/exams/{sample_exam.id}/questions/{sample_question.id}/rubrics"
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
