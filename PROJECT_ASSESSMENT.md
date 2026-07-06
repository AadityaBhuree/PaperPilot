# PaperPilot — Full Project Assessment & Execution Plan

> **Generated**: Principal Engineer Code Review
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

## 2.8 Frontend — Pages & Components ✅

### `Layout.tsx` ✅
- Fixed sidebar (64px logo area, navigation, version footer)
- 4 nav items: Dashboard, Exams, Upload, Documents
- Active state highlighting with indigo-50 background
- Max-width 6xl centered main content area
- Lucide icons for each nav item

### `Dashboard.tsx` ✅
- Loading state: centered text
- Header with welcome message
- 3 stat cards (Total Exams, Documents Uploaded, Completed OCR)
- Quick action buttons (Create Exam, Upload Document)
- Recent exams list (top 5, with link to detail)
- Empty state with icon for no exams

### `ExamList.tsx` ✅
- Loading state: centered text
- Header with "New Exam" button
- Empty state with icon + create CTA
- Exam cards with subject, marks, date metadata
- Delete with native confirm dialog
- Hover effects on cards

### `ExamForm.tsx` ✅
- Back navigation button
- Title, Subject, Description, Total Marks fields
- Validation (title required)
- Error display
- Submit with loading state
- Cancel button

### `ExamDetail.tsx` ✅
- Back navigation, exam metadata display
- Description display
- Add Question form (number, text, marks)
- Question cards with toggle expand
- Per-question: set answer key (textarea + key concepts)
- Per-question: add rubric criteria (criterion, description, max_score, weight)
- Visual indicators for questions with answer key (green check) and rubrics (amber target)
- Empty state for no questions

### `Upload.tsx` ✅
- 4-step progress indicator (Select → Upload → Process → Done)
- Exam selection dropdown (loaded on mount)
- Student name field (optional)
- Drag-and-drop zone with visual feedback (drag active, file selected)
- File type and size constraints displayed
- Sequential pipeline: upload → create submission → OCR → evaluate
- Success state with link to evaluate page
- Error display
- Loading states for each step

### `Documents.tsx` ✅
- Loading state: centered text
- Empty state with icon
- Document cards with: icon, filename, size, type, date
- Status badges (pending=yellow, processing=blue, completed=green, failed=red)
- Action buttons: Run OCR (pending only), View results (expand), Delete
- Expandable OCR results panel showing per-page extracted text with confidence

### `Evaluation.tsx` ✅
- Back navigation
- Document and Exam dropdown selectors (loaded on mount)
- Student name field (optional)
- "Run Evaluation" button with 3-step progress (submitting → evaluating → done)
- Error display
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
| 🔴 1 | **No authentication/authorization** | Anyone can access all endpoints, no user isolation | All |
| 🔴 2 | **No .env.example file** | New developers don't know what vars to set | `config.py` |
| 🔴 3 | **No database migrations (Alembic)** | Schema changes in production are manual/risky | Database |
| 🔴 4 | **No production database** | SQLite doesn't handle concurrency; data lost on container restart | Database |
| 🔴 5 | **No Docker setup** | No containerization for reproducible deployments | DevOps |

## 3.2 Backend Gaps

| # | Issue | Priority | Details |
|---|-------|----------|---------|
| 🟡 6 | No file upload magic-byte validation | Medium | Only validates by extension, not content |
| 🟡 7 | No request rate limiting | Medium | API unprotected against abuse |
| 🟡 8 | No structured logging / log aggregation | Low | Basic Python logging only |
| 🟡 9 | No health check details | Low | Root endpoint returns only `{"status": "ok"}` |
| 🟡 10 | No document preview/download endpoint | Medium | Users can't view uploaded files via API |
| 🟡 11 | No export functionality (CSV/PDF) | Medium | Can't export evaluation reports |
| 🟡 12 | OCR language config is basic | Low | Single language string, no auto-detection |
| 🟡 13 | No batch operation progress tracking | Medium | Batch evaluate returns no per-item progress |
| 🟡 14 | No request/response logging middleware | Low | Hard to debug API issues in production |
| 🟡 15 | `_ensure_ocr_text` runs OCR inline | Medium | Would block on large documents; no background task |
| 🟡 16 | No pagination on list endpoints | Medium | `/documents`, `/exams`, `/submissions` return all |

## 3.3 Frontend Gaps

| # | Issue | Priority | Details |
|---|-------|----------|---------|
| 🟡 17 | **Title tag says "Mainframe"** | Low | `index.html` title should be "PaperPilot" |
| 🟡 18 | **MainframeLanding page is unrelated** | Low | Creative agency landing page, not part of PaperPilot |
| 🟡 19 | No loading skeletons | Medium | Uses simple text "Loading..." instead of skeleton UI |
| 🟡 20 | No error boundaries | Medium | Unhandled errors crash the entire app |
| 🟡 21 | No pagination on lists | Medium | Large datasets will cause performance issues |
| 🟡 22 | No search/filter on exams or documents | Low | Growing lists hard to navigate |
| 🟡 23 | No toast notifications | Medium | Feedback uses inline alerts (not dismissible) |
| 🟡 24 | No mobile-responsive sidebar | Medium | Fixed sidebar layout doesn't collapse on mobile |
| 🟡 25 | **No exam summary results view** | Medium | Backend has `/exams/{id}/summary` but no frontend UI for it |
| 🟡 26 | No evaluation history page | Medium | Past evaluations not easily accessible |
| 🟡 27 | No real-time OCR status updates | Low | User must manually refresh to see processing status |
| 🟡 28 | No progress bar for batch evaluation | Medium | No visual feedback during batch operations |
| 🟡 29 | No confirmation dialogs (uses native `confirm()`) | Medium | UX inconsistency, breaks on iOS Safari |
| 🟡 30 | Upload flow doesn't navigate to results | Low | After upload+process, user must manually go to Evaluate page |
| 🟡 31 | No dark mode | Low | Not requested but noteworthy |

## 3.4 Cross-Cutting Gaps

| # | Issue | Priority | Details |
|---|-------|----------|---------|
| 🟡 32 | No API documentation beyond Swagger | Low | No hand-written API docs or postman collection |
| 🟡 33 | No integration/E2E tests | Medium | Only unit tests exist, no full-pipeline tests |
| 🟡 34 | No security audit | Medium | XSS, CSRF, injection not reviewed |
| 🟡 35 | No monitoring/alerting | Low | No error tracking (Sentry, etc.) |
| 🟡 36 | No Prettier/VSCode config | Low | No standardized code formatting config |

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

# 5. Execution Plan

## Phase 1 — Foundation & Polish (Days 1–2)

### Goal
Stabilize the existing codebase, fix immediate issues, and make it ready for new feature development.

### Tasks

| # | Task | Files Affected | Risk | Effort |
|---|------|---------------|------|--------|
| 1.1 | Extract shared `_get_llm()` to a central AI config module | New `backend/services/ai_config.py`, update 3 services | Low | 30 min |
| 1.2 | Add `.env.example` with all required vars | New `.env.example` | None | 5 min |
| 1.3 | Move `_run_evaluation` from API to services layer | `api/evaluation.py` → `services/evaluator_service.py` | Medium | 1 hr |
| 1.4 | Fix `index.html` title → "PaperPilot" | `frontend/index.html` | None | 1 min |
| 1.5 | Remove or gate off `MainframeLanding` route | `frontend/src/App.tsx` | None | 5 min |
| 1.6 | Add loading skeleton components | New `frontend/src/components/Skeleton.tsx`, update 5 pages | Low | 1 hr |
| 1.7 | Add error boundary | New `frontend/src/components/ErrorBoundary.tsx`, wrap in `App.tsx` | Low | 30 min |
| 1.8 | Add `pydantic-settings` for config validation | `backend/config.py` | Low | 15 min |

### Verification
- All existing tests must pass
- Frontend must build without errors
- App must load without console errors

---

## Phase 2 — Enhanced Frontend UX (Days 3–5)

### Goal
Make the frontend interactive, responsive, and polished with proper UX patterns.

### Tasks

| # | Task | Files Affected | Effort |
|---|------|---------------|--------|
| 2.1 | **Responsive Layout** — Collapsible sidebar with hamburger toggle on mobile | `Layout.tsx`, `App.tsx` | 2 hr |
| 2.2 | **Toast Notification System** — Success/error/info toasts with auto-dismiss | New `components/Toast.tsx` + context | 1.5 hr |
| 2.3 | **Confirmation Dialog Component** — Replace all native `confirm()` calls | New `components/ConfirmDialog.tsx`, update Documents, ExamList | 1 hr |
| 2.4 | **Exam Summary Results Page** — Frontend for `/exams/{id}/summary` endpoint | New `pages/ExamSummary.tsx`, add route | 2 hr |
| 2.5 | **Evaluation History Page** — List past evaluations with results | New `pages/EvaluationHistory.tsx`, API client updates | 2 hr |
| 2.6 | **Search/Filter for Exams** — Client-side search by title/subject | `ExamList.tsx` | 1 hr |
| 2.7 | **Search/Filter for Documents** — Client-side search by filename | `Documents.tsx` | 1 hr |
| 2.8 | **Pagination for Lists** — Paginate exams, documents (10 per page) | `ExamList.tsx`, `Documents.tsx`, custom hook | 2 hr |
| 2.9 | **Skeleton Loading States** — Replace all "Loading..." text with skeleton UIs | 5 page components | 1.5 hr |
| 2.10 | **Upload Flow Polish** — Navigate to evaluation results after successful upload | `Upload.tsx` | 30 min |
| 2.11 | **Mobile Responsiveness Audit** — Test all pages at <768px, fix issues | All pages | 2 hr |

### Verification
- Lighthouse mobile score >85
- All navigation flows work on mobile viewport
- All CRUD operations confirmed via UI

---

## Phase 3 — Backend Production Readiness (Days 6–8)

### Goal
Make the backend production-ready with proper database, migrations, and security.

### Tasks

| # | Task | Files Affected | Effort |
|---|------|---------------|--------|
| 3.1 | Add Alembic migrations | New `alembic/` directory, `alembic.ini` | 1.5 hr |
| 3.2 | PostgreSQL support — add asyncpg driver + connection string | `requirements.txt`, `config.py` | 1 hr |
| 3.3 | Add request rate limiting (slowapi) | `main.py`, new middleware | 1 hr |
| 3.4 | Add file magic-byte validation | `services/file_service.py` | 30 min |
| 3.5 | Add document preview endpoint | `api/documents.py`, `services/file_service.py` | 1 hr |
| 3.6 | Add CSV/PDF export for evaluation reports | New `services/export_service.py`, `api/evaluation.py` | 2 hr |
| 3.7 | Add pagination query params to list endpoints | `api/documents.py`, `api/exams.py`, `api/evaluation.py`, schemas | 2 hr |
| 3.8 | Add request logging middleware | `main.py` | 30 min |
| 3.9 | Centralize LLM config | New `services/llm_config.py` | 30 min |
| 3.10 | Add health check details (DB connection, AI API key status) | `main.py` | 30 min |

### Verification
- All tests pass with PostgreSQL (CI matrix)
- Alembic migrations work (upgrade + downgrade)
- Rate limiting functional (429 responses on abuse)
- Export generates valid CSV/PDF

---

## Phase 4 — Authentication & Multi-Tenancy (Days 9–12)

### Goal
Add user authentication, teacher/student roles, and data isolation.

### Tasks

| # | Task | Effort |
|---|------|--------|
| 4.1 | Add User model (id, email, password hash, role) | 1 hr |
| 4.2 | Add JWT auth (registration, login, refresh) | 2 hr |
| 4.3 | Add auth middleware/dependency for protected routes | 1 hr |
| 4.4 | Add role-based access control (teacher vs student) | 1.5 hr |
| 4.5 | Scope exams/documents/submissions to user | 2 hr |
| 4.6 | Add login/register pages (frontend) | 3 hr |
| 4.7 | Auth context + token management (frontend) | 1.5 hr |
| 4.8 | Protected routes with redirect to login | 1 hr |

### Verification
- Registration → Login → Access protected endpoints
- Teacher can see own exams only
- Unauthenticated requests get 401

---

## Phase 5 — Advanced Features & UX (Days 13–18)

### Goal
Build the differentiating features that make PaperPilot a complete product.

### Tasks

| # | Task | Effort | Dependencies |
|---|------|--------|-------------|
| 5.1 | Student mock exam mode (take exam in-app) | 3 hr | Phase 4 (auth) |
| 5.2 | Real-time OCR status via WebSocket/SSE | 2 hr | None |
| 5.3 | Batch evaluation progress bar (SSE) | 1.5 hr | 5.2 |
| 5.4 | Dashboard analytics (performance charts, trends) | 3 hr | Phase 4 (user data) |
| 5.5 | Student progress tracking over time | 2.5 hr | Phase 4, Phase 5.1 |
| 5.6 | Personalized revision suggestions based on weak areas | 3 hr | Phase 5.5 |
| 5.7 | Multi-language OCR support UI | 1.5 hr | None |
| 5.8 | Dark mode toggle | 1.5 hr | None |
| 5.9 | Docker + docker-compose setup | 1.5 hr | None |

---

# 6. File-by-File Implementation Roadmap

## Backend Files

```
backend/
├── config.py                          # 1.8: pydantic-settings
├── main.py                            # 3.3: rate limiting, 3.8: request logging, 3.10: detailed health
├── api/
│   ├── documents.py                   # 3.5: preview endpoint, 3.7: pagination
│   ├── exams.py                       # 3.7: pagination
│   └── evaluation.py                  # 1.3: move logic to services, 3.7: pagination
├── services/
│   ├── ai_config.py [NEW]             # 1.1: centralized LLM config
│   ├── evaluator_service.py           # 1.3: accept migrated evaluation logic
│   ├── file_service.py                # 3.4: magic-byte validation
│   ├── export_service.py [NEW]        # 3.6: CSV/PDF export
│   └── llm_config.py [NEW]            # 3.9: centralized model config
├── database/
│   └── connection.py                  # No changes needed
├── models/                            # 4.1: +User model
├── schemas/                           # 3.7: +pagination schemas, 3.6: +export schemas
├── middleware/ [NEW]
│   └── auth.py                        # 4.3: JWT auth middleware
├── tests/
│   ├── test_exams.py                  # +pagination tests
│   ├── test_evaluation.py            # +pagination tests + auth tests
│   └── test_auth.py [NEW]            # 4.x: auth tests
├── alembic/ [NEW]                     # 3.1: migration scripts
├── alembic.ini [NEW]                  # 3.1: Alembic config
├── .env.example [NEW]                 # 1.2: env template
└── Dockerfile [NEW]                   # 5.9: Docker image
```

## Frontend Files

```
frontend/
├── index.html                         # 1.4: fix title
├── package.json                       # +dependencies: react-hot-toast, recharts
├── src/
│   ├── App.tsx                        # 1.7: +ErrorBoundary, 2.1: responsive routing
│   ├── index.css                      # 5.8: dark mode variables
│   ├── api/
│   │   ├── client.ts                  # +new endpoints (auth, export, summary)
│   │   └── types.ts                   # +new types
│   ├── components/
│   │   ├── Layout.tsx                 # 2.1: responsive sidebar
│   │   ├── Skeleton.tsx [NEW]         # 2.9: reusable skeleton
│   │   ├── Toast.tsx [NEW]            # 2.2: toast system
│   │   ├── ConfirmDialog.tsx [NEW]    # 2.3: confirmation modal
│   │   ├── ErrorBoundary.tsx [NEW]    # 1.7: error boundary
│   │   ├── Pagination.tsx [NEW]       # 2.8: pagination controls
│   │   └── SearchBar.tsx [NEW]        # 2.6–2.7: search input
│   ├── hooks/
│   │   ├── useAuth.ts [NEW]           # 4.7: auth context hook
│   │   └── usePagination.ts [NEW]     # 2.8: pagination hook
│   ├── context/
│   │   ├── AuthContext.tsx [NEW]      # 4.7: auth provider
│   │   └── ToastContext.tsx [NEW]     # 2.2: toast provider
│   ├── pages/
│   │   ├── Dashboard.tsx              # 5.4: +charts, 2.9: +skeleton
│   │   ├── ExamList.tsx               # 2.6: +search, 2.8: +pagination, 2.9: +skeleton
│   │   ├── ExamForm.tsx               # 2.9: +skeleton
│   │   ├── ExamDetail.tsx             # 2.3: +confirm dialog, 2.9: +skeleton
│   │   ├── ExamSummary.tsx [NEW]      # 2.4: exam summary report page
│   │   ├── ExamList.tsx [MODIFY]      # 2.5: link to summary
│   │   ├── Upload.tsx                 # 2.10: +navigate to results
│   │   ├── Documents.tsx              # 2.7: +search, 2.8: +pagination, 2.9: +skeleton
│   │   ├── Evaluation.tsx             # 2.9: +skeleton, 5.3: +batch progress
│   │   ├── EvaluationHistory.tsx [NEW] # 2.5: past evaluations
│   │   ├── Login.tsx [NEW]            # 4.6: login page
│   │   └── Register.tsx [NEW]         # 4.6: register page
│   └── main.tsx                       # +AuthProvider, +ToastProvider
├── Dockerfile [NEW]                   # 5.9: multi-stage build
└── nginx.conf [NEW]                   # 5.9: reverse proxy config
```

---

# Summary Statistics

| Category | ✅ Done | ❌ Missing | ⚠️ Needs Fix |
|----------|---------|------------|--------------|
| Backend API endpoints | 24 | 0 | 5 need pagination |
| Backend models | 8 | 0 | 0 |
| Backend schemas | 22 | 0 | 0 |
| Backend services | 5 | 2 (export, llm_config) | 3 need refactors |
| Backend tests | 24 | 0 | 0 |
| Frontend pages | 7 | 4 (summary, history, login, register) | 5 need polish |
| Frontend components | 1 | 7 (skeleton, toast, confirm, error, pagination, search, dialogs) | 1 (layout responsive) |
| Infrastructure | 0 | 5 (docker, alembic, auth, rate-limit, monitoring) | 0 |

**Total effort estimate**: 30–40 engineering hours across 5 phases
