# PaperPilot — Full Project Assessment & Execution Plan

> **Generated**: July 8, 2026 (Revised)
> **Stack**: FastAPI (Python) + React 19 / TypeScript / Tailwind CSS (Frontend)
> **Database**: Async SQLite (dev), planned PostgreSQL
> **AI**: Google Gemini 1.5 Flash, LangChain, FAISS, Sentence Transformers
> **OCR**: EasyOCR, PyMuPDF, OpenCV

---

# Table of Contents

1. [Current Architecture Overview](#1-current-architecture-overview)
2. [What Has Been Implemented ✅](#2-what-has-been-implemented-)
3. [What Is Missing / Incomplete ❌](#3-what-is-missing--incomplete-)
4. [Issues & Technical Debt ⚠️](#4-issues--technical-debt-)
5. [Execution Plan (Phase 1–5)](#5-execution-plan)
6. [File-by-File Implementation Roadmap](#6-file-by-file-implementation-roadmap)

---

# 1. Current Architecture Overview

```
PaperPilot/
├── backend/
│   ├── api/           # FastAPI route handlers
│   ├── database/      # SQLAlchemy async engine + sessions
│   ├── models/        # ORM models (SQLAlchemy)
│   ├── schemas/       # Pydantic request/response schemas
│   ├── services/      # Business logic (OCR, AI eval, RAG, files)
│   ├── utils/         # Empty (placeholder)
│   ├── tests/         # Pytest test suite (with mocked LLMs)
│   ├── config.py      # Env-based configuration
│   └── main.py        # FastAPI app entry point
├── frontend/
│   └── src/
│       ├── api/       # Axios client + TypeScript types
│       ├── components/# Shared components (Layout)
│       ├── pages/     # Route page components
│       ├── App.tsx    # Router configuration
│       ├── index.css  # Tailwind + global styles
│       └── main.tsx   # React entry
├── .github/workflows/ # CI pipeline
└── requirements.txt   # Python dependencies
```

## Tech Stack (Current)

| Layer | Technology | Status |
|-------|-----------|--------|
| Backend Framework | FastAPI | Production-ready |
| Database | SQLite (aiosqlite) | Dev-only, works |
| ORM | SQLAlchemy 2.0 async | Production-ready |
| AI / LLM | Google Gemini 1.5 Flash + LangChain | Functional |
| OCR | EasyOCR + PyMuPDF | Functional |
| Vector Search | FAISS + Sentence Transformers | Functional |
| Frontend Framework | React 19 + TypeScript 6 | Production-ready |
| Styling | Tailwind CSS 4 | Production-ready |
| Icons | Lucide React | Production-ready |
| HTTP Client | Axios | Production-ready |
| CI | GitHub Actions | Functional |

---

# 2. What Has Been Implemented ✅

## 2.1 Backend — Infrastructure ✅

| Feature | Files | Status |
|---------|-------|--------|
| FastAPI app with lifespan lifecycle | `main.py` | ✅ Complete |
| CORS middleware (localhost:5173, :3000) | `main.py` | ✅ Complete |
| Env-based config (Settings class) | `config.py` | ✅ Complete |
| Async SQLAlchemy engine + session factory | `database/connection.py` | ✅ Complete |
| Auto table creation on startup | `database/connection.py` | ✅ Complete |
| Standard logging configuration | `main.py` | ✅ Complete |

## 2.2 Backend — Models (ORM) ✅

| Model | Table | Key Fields | Status |
|-------|-------|------------|--------|
| `UploadedDocument` | `uploaded_documents` | id (UUID), filename, type, size, status, uploaded_at | ✅ Complete |
| `OCRResult` | `ocr_results` | id, document_id, page_number, extracted_text, confidence | ✅ Complete |
| `Exam` | `exams` | id (UUID), title, description, subject, total_marks | ✅ Complete |
| `Question` | `questions` | id (UUID), exam_id, question_number, text, max_marks | ✅ Complete |
| `AnswerKey` | `answer_keys` | id, question_id, reference_answer, key_concepts | ✅ Complete |
| `Rubric` | `rubrics` | id, question_id, criterion, description, max_score, weight | ✅ Complete |
| `StudentSubmission` | `student_submissions` | id (UUID), document_id, exam_id, student_name | ✅ Complete |
| `Evaluation` | `evaluations` | id, submission_id, question_id, score, feedback, confidence, criterion_scores (JSON) | ✅ Complete |

**Relationships**: All proper foreign keys with CASCADE deletes, relationship back-populates.

## 2.3 Backend — Pydantic Schemas ✅

| Schema Group | Schemas | Status |
|-------------|---------|--------|
| Documents | `UploadResponse`, `DocumentResponse`, `OCRResultResponse`, `OCRResponse` | ✅ Complete |
| Exams | `ExamCreate`, `ExamUpdate`, `ExamResponse`, `ExamDetailResponse` | ✅ Complete |
| Questions | `QuestionCreate`, `QuestionResponse`, `QuestionDetailResponse` | ✅ Complete |
| Answer Keys | `AnswerKeyCreate`, `AnswerKeyResponse` | ✅ Complete |
| Rubrics | `RubricCreate`, `RubricResponse` | ✅ Complete |
| Submissions | `SubmissionCreate`, `SubmissionResponse` | ✅ Complete |
| Evaluation | `EvaluationResponse`, `EvaluationSummaryResponse`, `EvaluateSubmissionResponse` | ✅ Complete |
| Batch | `BatchEvaluateRequest`, `BatchEvaluateResponse`, `BatchSubmissionResult` | ✅ Complete |
| Summary | `ExamSummaryResponse`, `QuestionSummary`, `CriterionScoreResponse` | ✅ Complete |

All use `model_config = {"from_attributes": True}` for ORM mode, proper validation constraints.

## 2.4 Backend — API Routes ✅

### Documents API (`/api/documents`)
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/upload` | Upload file (PDF/JPG/PNG), save metadata | ✅ Complete |
| POST | `/{id}/process` | Run OCR on uploaded document | ✅ Complete |
| GET | `/{id}` | Get document with OCR results | ✅ Complete |
| GET | `/` | List all documents (desc by upload date) | ✅ Complete |
| DELETE | `/{id}` | Delete document + file + cascade OCR results | ✅ Complete |

### Exams API (`/api/exams`)
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/` | Create exam | ✅ Complete |
| GET | `/` | List all exams | ✅ Complete |
| GET | `/{id}` | Get exam with questions, answer keys, rubrics | ✅ Complete |
| PATCH | `/{id}` | Partial update exam metadata | ✅ Complete |
| DELETE | `/{id}` | Delete exam + cascade all | ✅ Complete |
| POST | `/{id}/questions` | Add question | ✅ Complete |
| GET | `/{id}/questions` | List questions | ✅ Complete |
| GET | `/{id}/questions/{qid}` | Question with answer key + rubrics | ✅ Complete |
| POST | `/{id}/questions/{qid}/answer-key` | Set/replace answer key | ✅ Complete |
| POST | `/{id}/questions/{qid}/rubrics` | Add rubric criterion | ✅ Complete |
| GET | `/{id}/questions/{qid}/rubrics` | List rubrics | ✅ Complete |

### Evaluation API (`/api/evaluation`)
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/submissions` | Create student submission | ✅ Complete |
| GET | `/submissions/{id}` | Get submission | ✅ Complete |
| GET | `/exams/{id}/submissions` | List submissions for exam | ✅ Complete |
| POST | `/submissions/{id}/evaluate` | Run full AI evaluation pipeline | ✅ Complete |
| POST | `/batch-evaluate` | Evaluate multiple submissions | ✅ Complete |
| GET | `/exams/{id}/summary` | Generate exam summary report | ✅ Complete |
| GET | `/submissions/{id}/results` | Get evaluation results | ✅ Complete |

## 2.5 Backend — Services ✅

### `file_service.py` ✅
- Validates file extensions against allowed set
- UUID-based stored filenames (preserves extensions)
- Async file writing with chunked reading (8KB chunks)
- Max file size enforcement (configurable)
- File path resolution and deletion

### `ocr_service.py` ✅
- Lazy-loaded EasyOCR reader (avoids cold start penalty)
- Image OCR via EasyOCR with configurable languages
- PDF processing with dual strategy:
  - Native text extraction for digital PDFs (PyMuPDF)
  - Render-to-image + OCR fallback for scanned PDFs
- Results merging with average confidence calculation
- Configurable GPU support

### `question_service.py` ✅
- Gemini-based question detection from OCR text
- Gemini-based answer extraction mapped to question numbers
- Structured LLM output via Pydantic schemas + `with_structured_output`
- Temperature 0.0 for deterministic extraction

### `evaluator_service.py` ✅
- Gemini-based grading with structured output (`EvaluationResult`)
- Rubric-aware evaluation prompt with per-criterion scoring
- Configurable LLM model (gemini-1.5-flash, temperature 0.1)
- Confidence scoring on evaluations
- JSON-serialized criterion scores for DB storage

### `rag_service.py` ✅
- HuggingFace MiniLM embeddings (sentence-transformers/all-MiniLM-L6-v2)
- FAISS vector store building from answer keys
- Similarity search with score for reference retrieval
- Persistent FAISS index to disk
- Lazy-loaded embeddings model

## 2.6 Backend — Tests ✅

| Test File | Tests | Status |
|-----------|-------|--------|
| `test_exams.py` | 11 tests — exam CRUD, questions, answer keys, rubrics | ✅ Complete |
| `test_evaluation.py` | 10 tests — submissions, evaluate, batch, summary, edge cases | ✅ Complete |
| `test_services.py` | 3 tests — evaluator, question detection, answer extraction (mocked LLM) | ✅ Complete |
| `conftest.py` | In-memory SQLite, HTTP test client, 6 fixtures (exam, question, rubric, answer_key, document) | ✅ Complete |

## 2.7 Frontend — Infrastructure ✅

| Feature | Details | Status |
|---------|---------|--------|
| Vite 8 + React 19 + TypeScript 6 | Modern build tooling | ✅ Complete |
| Tailwind CSS 4 | via @tailwindcss/vite plugin | ✅ Complete |
| React Router DOM 7 | Client-side routing | ✅ Complete |
| Axios | HTTP client with proxy config | ✅ Complete |
| Lucide React | Icon library | ✅ Complete |
| ESLint 10 | TypeScript + React hooks rules | ✅ Complete |
| Toast Notification System | Context-based toast provider with auto-dismiss | ✅ Complete |
| Confirmation Dialog | Reusable modal for destructive actions | ✅ Complete |
| Error Boundary | Class-based error boundary with retry | ✅ Complete |
| Pagination Component | Reusable pagination with page numbers + ellipsis | ✅ Complete |
| Skeleton Loading | Reusable skeleton primitives and patterns | ✅ Complete |
| Responsive Layout | Collapsible sidebar with hamburger toggle on mobile | ✅ Complete |

## 2.8 Frontend — Pages & Components ✅

### `Layout.tsx` ✅
- Fixed sidebar (64px logo area, navigation, user info)
- 6 nav items: Dashboard, Exams, Upload, Documents, History
- Active state highlighting with indigo-50 background
- Responsive: collapsible sidebar with hamburger toggle + backdrop overlay on mobile
- User display name and email in sidebar footer
- Logout button with hover state
- Max-width 6xl centered main content area
- Lucide icons for each nav item

### `Dashboard.tsx` ✅
- Loading state: skeleton placeholders (lines, blocks, stat cards)
- Header with welcome message
- 3 stat cards with icons (Total Exams, Documents Uploaded, Completed OCR)
- Quick action buttons (Create Exam, Upload Document)
- Recent exams list (top 5, with link to detail)
- Empty state with icon for no exams

### `ExamList.tsx` ✅
- Loading state: skeleton lines + button block
- Header with "New Exam" button
- Search/filter by title or subject
- Pagination (10 per page) with shared Pagination component
- Confirmation dialog for delete (replaces native confirm)
- Exam cards with subject, marks, date metadata, result links
- Empty state with icon + create CTA
- Link to exam summary from each card

### `ExamForm.tsx` ✅
- Back navigation button
- Title, Subject, Description, Total Marks fields
- Validation (title required)
- Error display
- Submit with loading state
- Cancel button

### `ExamDetail.tsx` ✅
#### Details Tab ✅
- Back navigation, exam metadata display
- Description display
- Add Question form (number, text, marks)
- Question cards with toggle expand
- Per-question: set answer key (textarea + key concepts)
- Per-question: add rubric criteria (criterion, description, max_score, weight)
- Visual indicators for questions with answer key (green check) and rubrics (amber target)
- Empty state for no questions

#### Submissions Tab ✅
- Full list of submissions for the exam
- Per-submission: student name, date, score badge, progress bar
- Batch evaluation with per-submission progress tracking
- Progress bar + individual status icons during batch evaluation
- Color-coded score badges (green ≥70%, amber ≥40%, red <40%)
- Select/deselect unevaluated submissions, select-all toggle
- Refresh button
- Pagination (20 per page)
- Link to detailed results view per submission

#### Summary Tab ✅
- Summary report overview with link to full `/exams/:id/summary` page

### `Upload.tsx` ✅
- 4-step progress indicator (Select → Upload → Process → Done)
- Exam selection dropdown (loaded on mount)
- Student name field (optional)
- File type and size constraints displayed
- Sequential pipeline: upload → create submission → OCR → evaluate
- Success state with link to evaluate or evaluation history
- Error display
- Loading states for each step
- Skeleton loading states

### `Documents.tsx` ✅
- Loading state: skeleton lines + blocks
- Empty state with icon
- Document cards with: icon, filename, size, type, date
- Status badges (pending=yellow, processing=blue, completed=green, failed=red)
- Action buttons: Run OCR (pending only), View results (expand), Delete with confirmation dialog
- Expandable OCR results panel showing per-page extracted text with confidence
- Search/filter by filename
- Pagination (10 per page) with shared Pagination component
- Error and empty states with actionable CTAs

### `Evaluation.tsx` ✅
- Document and Exam dropdown selectors (loaded on mount)
- Student name field (optional)
- "Run Evaluation" button with 3-step progress (submitting → evaluating → done)
- Error display with inline alert
- Skeleton loading states
- Results view:
  - Circular percentage score display
  - Total score / max score
  - Per-question evaluation cards with expand/collapse
  - Color-coded score badges (green ≥80%, amber ≥50%, red <50%)
  - Extracted answer display
  - AI feedback
  - Per-criterion rubric breakdown with scores

## 2.9 CI ✅

| Job | Steps | Status |
|-----|-------|--------|
| Frontend | Checkout, Node 20, npm ci, lint, build | ✅ Complete |
| Backend | Checkout, Python 3.12, pip install, pytest | ✅ Complete |

---

# 3. What Is Missing / Incomplete ❌

## 3.1 Critical Gaps (Blocking Production)

| # | Issue | Impact | Affected Area |
|---|-------|--------|---------------|
| ~~🔴 1~~ | ~~**No authentication/authorization**~~ | ~~Anyone can access all endpoints~~ | ~~All~~ | ✅ **Resolved** — JWT auth with User model, login/register, protected routes, AuthContext, role-based access |
| 🟡 2 | **No .env.example file** | New developers don't know what vars to set | `config.py` |
| ~~🔴 3~~ | ~~**No database migrations (Alembic)**~~ | ~~Schema changes are manual/risky~~ | ~~Database~~ | ✅ **Resolved** — `alembic/` with initial migrations |
| 🔴 4 | **No production database** | SQLite doesn't handle concurrency; data lost on container restart | Database |
| 🔴 5 | **No Docker setup** | No containerization for reproducible deployments | DevOps |

## 3.2 Backend Gaps

| # | Issue | Priority | Details |
|---|-------|----------|---------|
| 🟡 6 | No file upload magic-byte validation | Medium | Only validates by extension, not content |
| ~~🟡 7~~ | ~~No request rate limiting~~ | ~~Medium~~ | ✅ **Resolved** — SlowAPI rate limiter middleware configured globally |
| 🟡 8 | No structured logging / log aggregation | Low | Basic Python logging only |
| 🟡 9 | No health check details | Low | Root endpoint returns only `{"status": "ok"}` |
| 🟡 10 | No document preview/download endpoint | Medium | Users can't view uploaded files via API |
| 🟡 11 | No export functionality (CSV/PDF) | Medium | Can't export evaluation reports |
| 🟡 12 | OCR language config is basic | Low | Single language string, no auto-detection |
| ~~🟡 13~~ | ~~No batch operation progress tracking~~ | ~~Medium~~ | ✅ **Resolved** — `/batch-evaluate` endpoint returns per-item status with individual errors |
| 🟡 14 | No request/response logging middleware | Low | Hard to debug API issues in production |
| 🟡 15 | `_ensure_ocr_text` runs OCR inline | Medium | Would block on large documents; no background task |
| ~~🟡 16~~ | ~~No pagination on list endpoints~~ | ~~Medium~~ | ✅ **Resolved** — `/documents`, `/exams`, `/submissions` all paginated via `PaginationParams` |

## 3.3 Frontend Gaps

| # | Issue | Priority | Details |
|---|-------|----------|---------|
| 🟡 17 | **Title tag says "Mainframe"** | Low | `index.html` title should be "PaperPilot" |
| 🟡 18 | **MainframeLanding page is unrelated** | Low | Creative agency landing page, not part of PaperPilot |
| ~~🟡 19~~ | ~~No loading skeletons~~ | ~~Medium~~ | ✅ **Resolved** — `Skeleton.tsx` with Line, Block, Card, List, StatsGrid, DetailHeader patterns |
| ~~🟡 20~~ | ~~No error boundaries~~ | ~~Medium~~ | ✅ **Resolved** — `ErrorBoundary.tsx` wrapping the whole app |
| ~~🟡 21~~ | ~~No pagination on lists~~ | ~~Medium~~ | ✅ **Resolved** — `Pagination.tsx` component used in ExamList, Documents, EvaluationHistory, ExamDetail |
| ~~🟡 22~~ | ~~No search/filter on exams or documents~~ | ~~Low~~ | ✅ **Resolved** — search on ExamList + Documents pages |
| ~~🟡 23~~ | ~~No toast notifications~~ | ~~Medium~~ | ✅ **Resolved** — `Toast.tsx` context-based system with auto-dismiss and success/error/info variants |
| ~~🟡 24~~ | ~~No mobile-responsive sidebar~~ | ~~Medium~~ | ✅ **Resolved** — collapsible sidebar with hamburger toggle + backdrop overlay |
| ~~🟡 25~~ | ~~No exam summary results view~~ | ~~Medium~~ | ✅ **Resolved** — `ExamSummary.tsx` page with per-question breakdown, stats grid, detailed score table |
| ~~🟡 26~~ | ~~No evaluation history page~~ | ~~Medium~~ | ✅ **Resolved** — `EvaluationHistory.tsx` with search, exam filter, pagination, score cards |
| ~~🟡 27~~ | ~~No real-time OCR status updates~~ | ~~Low~~ | 🔄 Still missing — user must manually refresh |
| ~~🟡 28~~ | ~~No progress bar for batch evaluation~~ | ~~Medium~~ | ✅ **Resolved** — per-submission progress tracking with status icons in ExamDetail submissions tab |
| ~~🟡 29~~ | ~~No confirmation dialogs (uses native `confirm()`)~~ | ~~Medium~~ | ✅ **Resolved** — `ConfirmDialog.tsx` replacing native confirm on documents and exams |
| ~~🟡 30~~ | ~~Upload flow doesn't navigate to results~~ | ~~Low~~ | ✅ **Resolved** — success state links to evaluation or history |
| 🟡 31 | No dark mode | Low | Not requested but noteworthy |

## 3.4 Cross-Cutting Gaps

| # | Issue | Priority | Details |
|---|-------|----------|---------|
| 🟡 32 | No API documentation beyond Swagger | Low | No hand-written API docs or postman collection |
| 🟡 33 | No integration/E2E tests | Medium | Only unit tests exist, no full-pipeline tests |
| 🟡 34 | No security audit | Medium | XSS, CSRF, injection not reviewed |
| 🟡 35 | No monitoring/alerting | Low | No error tracking (Sentry, etc.) |
| 🟡 36 | No Prettier/VSCode config | Low | No standardized code formatting config |

**Progress Summary**: Of 36 originally identified gaps, **20 resolved** ✅, 1 in progress 🔄, **15 remain** ❌

---

# 4. Issues & Technical Debt ⚠️

## 4.1 Code Quality Issues

| # | Location | Issue | Severity |
|---|----------|-------|----------|
| 1 | `evaluation.py` line ~332 | `_to_eval_response` uses bare `try/except` catching all `json.JSONDecodeError, TypeError` | Low |
| 2 | `question_service.py` | Duplicate `_get_llm()` function (also in evaluator_service.py) | Medium — extract to shared util |
| 3 | `rag_service.py` | `build_vector_store` creates placeholder document for empty input — fragile | Low |
| 4 | `rag_service.py` | FAISS `allow_dangerous_deserialization=True` | Medium — security concern for production |
| 5 | `config.py` | `Settings` class uses `os.getenv` — no validation library (pydantic-settings) | Low |
| 6 | `Evaluation` model | `criterion_scores` stored as JSON string in TEXT column | Low — works but not queryable |
| 7 | Multiple files | No type hints on some functions (e.g., `_merge_results` returns `tuple[str, float]` but not annotated) | Low |
| 8 | `evaluation.py` | `_run_evaluation` is a private function imported elsewhere — should be public or in service layer | Medium |
| 9 | `evaluation.py` | `defaultdict(lambda: [0.0, 0.0])` — magic list use | Low |

## 4.2 Architectural Concerns

| # | Concern | Details |
|---|---------|---------|
| 1 | **Service layer bypassed** | `_run_evaluation` is in `api/evaluation.py`, not in a service module | Business logic in API layer |
| 2 | **Single-module LLM config** | Each service has its own `_get_llm()` with hardcoded model name | Should be centralized |
| 3 | **No background task queue** | OCR and evaluation run synchronously in request thread | Blocks for large docs |
| 4 | **No caching layer** | Every evaluation runs fresh, no result caching | Expensive with Gemini API |
| 5 | **Frontend no state management** | No React Query, Zustand, or Context for shared state | Props drilling for shared data |

---

# 5. Execution Plan (Revised)

> **Status**: Phases 1–4 are substantially complete. The plan below is revised to reflect current progress and reprioritize remaining work.

## ✅ Completed (Phases 1–4)

### Phase 1 — Foundation & Polish
| # | Task | Status |
|---|------|--------|
| 1.1 | Extract shared `_get_llm()` to central AI config module | ✅ `services/ai_config.py` |
| 1.2 | Add `.env.example` with all required vars | ❌ Still missing |
| 1.3 | Move `_run_evaluation` from API to services layer | ❌ Still in `api/evaluation.py` |
| 1.4 | Fix `index.html` title → "PaperPilot" | ❌ Still says "Mainframe" |
| 1.5 | Remove or gate off `MainframeLanding` route | ❌ Still exposed |
| 1.6 | Add loading skeleton components | ✅ `Skeleton.tsx` with 6 patterns |
| 1.7 | Add error boundary | ✅ `ErrorBoundary.tsx` |
| 1.8 | Add `pydantic-settings` for config validation | ❌ Still uses `os.getenv` |

### Phase 2 — Enhanced Frontend UX
| # | Task | Status |
|---|------|--------|
| 2.1 | Responsive Layout | ✅ Collapsible sidebar + overlay |
| 2.2 | Toast Notification System | ✅ `Toast.tsx` with context |
| 2.3 | Confirmation Dialog Component | ✅ `ConfirmDialog.tsx` |
| 2.4 | Exam Summary Results Page | ✅ `ExamSummary.tsx` |
| 2.5 | Evaluation History Page | ✅ `EvaluationHistory.tsx` |
| 2.6 | Search/Filter for Exams | ✅ Search in `ExamList.tsx` |
| 2.7 | Search/Filter for Documents | ✅ Search in `Documents.tsx` |
| 2.8 | Pagination for Lists | ✅ `Pagination.tsx` on all list pages |
| 2.9 | Skeleton Loading States | ✅ All pages use Skeleton |
| 2.10 | Upload Flow Polish | ✅ Links to history/results |
| 2.11 | Mobile Responsiveness Audit | ✅ Sidebar responsive |

### Phase 3 — Backend Production Readiness
| # | Task | Status |
|---|------|--------|
| 3.1 | Add Alembic migrations | ✅ `alembic/` with initial migrations |
| 3.2 | PostgreSQL support | ❌ Still SQLite-only |
| 3.3 | Add request rate limiting | ✅ SlowAPI middleware |
| 3.4 | Add file magic-byte validation | ❌ Still missing |
| 3.5 | Add document preview endpoint | ❌ Still missing |
| 3.6 | Add CSV/PDF export for reports | ❌ Still missing |
| 3.7 | Add pagination query params | ✅ All list endpoints paginated |
| 3.8 | Add request logging middleware | ❌ Still missing |
| 3.9 | Centralize LLM config | ✅ `services/ai_config.py` |
| 3.10 | Add health check details | ❌ Still minimal |

### Phase 4 — Authentication & Multi-Tenancy
| # | Task | Status |
|---|------|--------|
| 4.1 | Add User model | ✅ `models/user.py` |
| 4.2 | Add JWT auth | ✅ Login/register/refresh |
| 4.3 | Auth middleware/protected routes | ✅ `middleware/rate_limiter.py`, `ProtectedRoute.tsx` |
| 4.4 | Role-based access control (teacher vs student) | ✅ `UserRole` enum + guards |
| 4.5 | Scope exams/documents to user | ❌ Still global (no user isolation) |
| 4.6 | Login/register pages (frontend) | ✅ `Login.tsx`, `Register.tsx` |
| 4.7 | Auth context + token management | ✅ `AuthContext.tsx` |
| 4.8 | Protected routes with redirect | ✅ `ProtectedRoute.tsx` wrapper |

---

## Phase 5 — Production Hardening (Next Priorities → ~2 weeks)

### Goal
Complete the last critical gaps: production database, Docker, data isolation, and polish.

### Tasks

| # | Task | Effort | Priority |
|---|------|--------|----------|
| 5.1 | **PostgreSQL support** — Add asyncpg, update connection string, test CI matrix | 1 hr | 🔴 High |
| 5.2 | **Docker + docker-compose** — Backend + frontend containers, nginx reverse proxy | 2 hr | 🔴 High |
| 5.3 | **Add `.env.example`** — Document all required env vars | 15 min | 🔴 High |
| 5.4 | **User data isolation** — Scope exams/documents/submissions to user_id | 2 hr | 🔴 High |
| 5.5 | **File magic-byte validation** — Validate content-type, not just extension | 30 min | 🟡 Medium |
| 5.6 | **Fix `index.html` title** → "PaperPilot" | 1 min | 🟡 Medium |
| 5.7 | **Remove/gate `MainframeLanding` route** | 5 min | 🟡 Medium |
| 5.8 | **Add pydantic-settings** for config validation | 15 min | 🟡 Medium |
| 5.9 | **Add request logging middleware** | 30 min | 🟡 Medium |
| 5.10 | **Add health check details** (DB, AI API key) | 30 min | 🟡 Medium |
| 5.11 | **Move `_run_evaluation` to service layer** | 1 hr | 🟡 Medium |

### Verification
- All 29 backend tests pass
- `docker-compose up` starts full stack
- PostgreSQL: create DB → run migrations → seed → query
- New user sees empty state (isolation works)

---

## Phase 6 — Feature Expansion (~2–3 weeks)

### Goal
Build differentiating features that make PaperPilot a complete product.

### Tasks

| # | Task | Effort | Dependencies |
|---|------|--------|-------------|
| 6.1 | **Document preview/download endpoint** | 1.5 hr | None |
| 6.2 | **CSV/PDF export for evaluation reports** | 2 hr | None |
| 6.3 | **Student mock exam mode** (take exam in-app) | 3 hr | Phase 4 (auth) |
| 6.4 | **Real-time OCR status** via WebSocket/SSE | 2 hr | None |
| 6.5 | **Dashboard analytics** (charts, trends, performance) | 3 hr | Phase 5.4 (user data) |
| 6.6 | **Dark mode toggle** | 1.5 hr | None |
| 6.7 | **Multi-language OCR support UI** | 1.5 hr | None |
| 6.8 | **Student progress tracking over time** | 2.5 hr | Phase 6.3 |
| 6.9 | **Personalized revision suggestions** | 3 hr | Phase 6.8 |
| 6.10 | **Integration/E2E tests** | 3 hr | None |

---

# 6. File-by-File Implementation Roadmap (Current State)

> **Legend**: ✅ = implemented, 🔄 = needs work, ❌ = not started

## Backend Files

```
backend/
├── config.py                          🔄 Switch to pydantic-settings
├── main.py                            ✅ Rate limiting, routers, CORS, lifespan
├── api/
│   ├── auth.py                        ✅ JWT auth (login, register, me)
│   ├── documents.py                   ✅ All endpoints + pagination
│   ├── exams.py                       ✅ All endpoints + pagination
│   └── evaluation.py                  🔄 Move _run_evaluation to services
├── services/
│   ├── ai_config.py                   ✅ Centralized LLM config + get_llm()
│   ├── auth_service.py                ✅ JWT creation/verification
│   ├── evaluator_service.py           ✅ EvaluationInput, evaluate_answer
│   ├── file_service.py                🔄 Add magic-byte validation
│   ├── ocr_service.py                 ✅ EasyOCR + PyMuPDF
│   ├── question_service.py            ✅ Question detection + answer extraction
│   └── rag_service.py                 ✅ FAISS + embeddings
├── database/
│   └── connection.py                  ✅ Async SQLAlchemy
├── models/
│   ├── user.py                        ✅ User + UserRole
│   ├── document.py                    ✅ UploadedDocument + OCRResult
│   ├── evaluation.py                  ✅ StudentSubmission + Evaluation
│   └── exam.py                        ✅ Exam, Question, AnswerKey, Rubric
├── schemas/
│   ├── auth.py                        ✅ LoginRequest, RegisterRequest, etc.
│   ├── document.py                    ✅ Upload/OCR response schemas
│   ├── evaluation.py                  ✅ All evaluation + batch + summary schemas
│   ├── exam.py                        ✅ All exam + question + rubric schemas
│   └── pagination.py                  ✅ PaginationParams + PaginatedResponse
├── middleware/
│   └── rate_limiter.py                ✅ SlowAPI configuration
├── tests/
│   ├── conftest.py                    ✅ 6 fixtures, in-memory SQLite
│   ├── test_exams.py                  ✅ 11 tests
│   ├── test_evaluation.py            ✅ 10 tests (submissions, evaluate, batch, summary)
│   └── test_services.py              ✅ 3 tests (mocked LLM)
├── alembic/                           ✅ Initial migrations
├── alembic.ini                        ✅ Alembic config
├── .env.example                       ❌ Still missing
└── Dockerfile                         ❌ Still missing
```

## Frontend Files

```
frontend/
├── index.html                         ❌ Still says "Mainframe"
├── package.json                       ✅ Dependencies installed
├── src/
│   ├── App.tsx                        ✅ All routes, ErrorBoundary, auth guard
│   ├── index.css                      ✅ Tailwind + global styles
│   ├── main.tsx                       ✅ AuthProvider + ToastProvider
│   ├── api/
│   │   ├── client.ts                  ✅ All API functions
│   │   └── types.ts                   ✅ All TypeScript interfaces
│   ├── components/
│   │   ├── Layout.tsx                 ✅ Responsive sidebar, 6 nav items
│   │   ├── Skeleton.tsx               ✅ 6 skeleton patterns
│   │   ├── Toast.tsx                  ✅ Context + auto-dismiss
│   │   ├── ConfirmDialog.tsx          ✅ Modal with variant styling
│   │   ├── ErrorBoundary.tsx          ✅ Class-based with retry
│   │   ├── Pagination.tsx             ✅ Page numbers + ellipsis
│   │   └── ProtectedRoute.tsx         ✅ Auth guard with redirect
│   ├── context/
│   │   └── AuthContext.tsx            ✅ Auth provider with token management
│   └── pages/
│       ├── Dashboard.tsx              ✅ Skeleton loading, stat cards
│       ├── ExamList.tsx               ✅ Search + pagination + confirm dialog
│       ├── ExamForm.tsx               ✅ Create/edit form with validation
│       ├── ExamDetail.tsx             ✅ 3 tabs (Details/Submissions/Summary)
│       ├── ExamSummary.tsx            ✅ Stats grid + per-question breakdown
│       ├── Upload.tsx                 ✅ 4-step pipeline
│       ├── Documents.tsx              ✅ Search + pagination + OCR results
│       ├── Evaluation.tsx             ✅ Single evaluation with results
│       ├── EvaluationHistory.tsx      ✅ Search + filter + pagination
│       ├── SubmissionResults.tsx      ✅ Detailed per-question results
│       ├── Login.tsx                  ✅ Login form with validation
│       └── Register.tsx              ✅ Register form with role selection
├── Dockerfile                         ❌ Still missing
└── nginx.conf                         ❌ Still missing
```

---

# Summary Statistics (Revised)

| Category | ✅ Done | 🔄 In Progress | ❌ Missing |
|----------|---------|----------------|------------|
| Backend API endpoints (24 planned) | 24 | 0 | 0 |
| Backend models (8 planned) | 8 | 0 | 0 |
| Backend schemas (22 planned) | 22 | 0 | 0 |
| Backend services (7 planned) | 6 | 1 (file_service) | 1 (export) |
| Backend tests (24 planned) | 24 | 0 | 0 |
| Frontend pages (13 planned) | 12 | 1 (ExamDetail has minor lint) | 0 |
| Frontend components (7 planned) | 7 | 0 | 0 |
| Infrastructure (5 planned) | 3 (alembic, auth, rate-limit) | 0 | 2 (docker, monitoring) |
| Remaining gaps (36 identified) | 20 resolved | 1 in progress | 15 remain |

**Total effort estimate (remaining)**: ~15–20 engineering hours across Phases 5–6

