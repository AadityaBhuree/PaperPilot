"""Shared test fixtures for PaperPilot backend tests."""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.api.documents import router as documents_router
from backend.api.evaluation import router as evaluation_router
from backend.api.exams import router as exams_router
from backend.database.connection import get_session
from backend.main import app
from backend.models.base import Base
from backend.models.document import DocumentStatus, UploadedDocument
from backend.models.exam import AnswerKey, Exam, Question, Rubric


# ---------------------------------------------------------------------------
# In-memory async database engine
# ---------------------------------------------------------------------------

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def db_engine():
    """Create an in-memory SQLite engine for tests."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine):
    """Yield an async database session, rolling back after each test."""
    session_factory = async_sessionmaker(
        db_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with session_factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_engine):
    """Async HTTP test client wired to the in-memory database."""
    session_factory = async_sessionmaker(
        db_engine, class_=AsyncSession, expire_on_commit=False
    )

    async def _override_get_session():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_session] = _override_get_session
    # Clear any previous routers to avoid duplicates on re-import
    app.routes.clear()
    app.include_router(documents_router)
    app.include_router(exams_router)
    app.include_router(evaluation_router)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Factories for test data
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def sample_exam(db_session: AsyncSession) -> Exam:
    """Create and persist a sample exam."""
    exam = Exam(
        title="Midterm Exam",
        description="Calculus I midterm",
        subject="Mathematics",
        total_marks=20,
    )
    db_session.add(exam)
    await db_session.flush()
    return exam


@pytest_asyncio.fixture
async def sample_question(db_session: AsyncSession, sample_exam: Exam) -> Question:
    """Create and persist a sample question linked to the exam."""
    question = Question(
        exam_id=sample_exam.id,
        question_number=1,
        question_text="Explain the fundamental theorem of calculus.",
        max_marks=10,
    )
    db_session.add(question)
    await db_session.flush()
    return question


@pytest_asyncio.fixture
async def sample_rubric(db_session: AsyncSession, sample_question: Question) -> Rubric:
    """Create and persist a sample rubric criterion."""
    rubric = Rubric(
        question_id=sample_question.id,
        criterion="Content Accuracy",
        description="Demonstrates understanding of core concepts",
        max_score=5.0,
        weight=1.0,
    )
    db_session.add(rubric)
    await db_session.flush()
    return rubric


@pytest_asyncio.fixture
async def sample_answer_key(
    db_session: AsyncSession, sample_question: Question
) -> AnswerKey:
    """Create and persist a sample answer key."""
    ak = AnswerKey(
        question_id=sample_question.id,
        reference_answer="The fundamental theorem connects differentiation and integration.",
        key_concepts="differentiation, integration, antiderivative",
    )
    db_session.add(ak)
    await db_session.flush()
    return ak


@pytest_asyncio.fixture
async def sample_document(db_session: AsyncSession) -> UploadedDocument:
    """Create and persist a sample uploaded document with pre-existing OCR."""
    from backend.models.document import OCRResult

    doc = UploadedDocument(
        original_filename="answer_sheet.pdf",
        stored_filename="test_file.pdf",
        file_type="pdf",
        file_size=1024,
        status=DocumentStatus.COMPLETED,
    )
    db_session.add(doc)
    await db_session.flush()

    ocr = OCRResult(
        document_id=doc.id,
        page_number=1,
        extracted_text="1. The fundamental theorem connects differentiation and integration.\n",
        confidence=0.95,
    )
    db_session.add(ocr)
    await db_session.flush()
    return doc
