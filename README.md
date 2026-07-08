# 📄 PaperPilot

> **Fair. Explainable. AI-Powered Evaluation.**

PaperPilot is an open-source AI-powered exam evaluation platform. It uses OCR and LLMs (Google Gemini) to automatically grade answer sheets against rubrics, providing explainable scores and detailed feedback.

---

# ✨ Features

## Current
- 📝 **Exam Management** — Create exams, add questions, define answer keys and rubrics
- 📄 **Document Upload & OCR** — Upload PDF/JPG/PNG answer sheets; auto-extract text via EasyOCR
- 🤖 **AI Evaluation** — Grade answers against rubrics using Google Gemini; per-criterion scoring
- 📊 **Exam Summary Reports** — Per-question averages, score distributions, highest/lowest performers
- 📋 **Evaluation History** — Browse past evaluations with search, filter, and pagination
- 🔄 **Batch Evaluation** — Evaluate multiple submissions with progress tracking
- 🔐 **Authentication** — JWT-based login/register; teacher & student roles
- 📱 **Responsive UI** — Mobile-friendly sidebar, skeleton loading, toast notifications

## Planned
- 📥 Export reports (CSV/PDF)
- 🧑‍🎓 Student mock exam mode
- 📈 Dashboard analytics & charts
- 🌙 Dark mode
- 🌍 Multi-language OCR support

---

# 🧠 Evaluation Pipeline

```
Upload Answer Sheet
       ↓
OCR & Document Processing
       ↓
Question Detection
       ↓
Answer Extraction
       ↓
Reference Answer Retrieval (via RAG)
       ↓
Rubric-Based AI Evaluation
       ↓
Explainable Score Generation
       ↓
Results View / Summary Reports
```

---

# 🏁 Getting Started

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.10+ |
| Node.js | 18+ |
| Google Gemini API key | [Get one free](https://aistudio.google.com/apikey) |

## 1. Clone & set up

```bash
git clone https://github.com/your-username/PaperPilot.git
cd PaperPilot
```

## 2. Backend

```bash
# Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Set env vars
set GEMINI_API_KEY=your_key_here   # Windows
# export GEMINI_API_KEY=your_key_here  # macOS / Linux

# Run migrations (first time)
alembic upgrade head

# Start the API server
uvicorn backend.main:app --reload
```

The API docs are available at [http://localhost:8000/docs](http://localhost:8000/docs).

## 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app is available at [http://localhost:5173](http://localhost:5173). API requests are proxied to the backend automatically.

## 4. Run tests

```bash
# Backend (29 tests)
PYTHONPATH=. python -m pytest backend/tests/ -v

# Frontend typecheck + lint
cd frontend && npx tsc --noEmit && npm run lint
```

---

# 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python) + SQLAlchemy 2.0 async |
| Database | SQLite (dev) → PostgreSQL (planned) |
| AI / LLM | Google Gemini 1.5 Flash + LangChain |
| OCR | EasyOCR + PyMuPDF + OpenCV |
| Vector Search | FAISS + Sentence Transformers |
| Frontend | React 19 + TypeScript 6 + Tailwind CSS 4 |
| State | React Context (auth, toasts) |
| Auth | JWT (access + refresh tokens) |
| CI | GitHub Actions (frontend lint+build, backend pytest) |

---

# 📂 Project Structure

```
PaperPilot/
├── backend/
│   ├── api/           # FastAPI route handlers
│   ├── database/      # SQLAlchemy engine + sessions
│   ├── middleware/     # Rate limiter
│   ├── models/        # ORM models (User, Exam, Document, Evaluation, …)
│   ├── schemas/       # Pydantic request/response schemas
│   ├── services/      # AI evaluation, OCR, RAG, file management
│   ├── tests/         # 29 pytest tests (mocked LLM)
│   ├── config.py      # Env-based settings
│   └── main.py        # FastAPI entry point
├── frontend/
│   └── src/
│       ├── api/       # Axios client + TypeScript types
│       ├── components/# Layout, Skeleton, Toast, Pagination, …
│       ├── context/   # AuthContext, ToastContext
│       └── pages/     # 13 route pages
├── alembic/           # Database migrations
├── .github/workflows/ # CI pipeline
└── requirements.txt
```

---

# 🗺️ Development Roadmap

**Phase 5 (Next — ~2 weeks):** Production hardening
- PostgreSQL support + Docker setup
- User data isolation (scope exams/documents to user)
- File magic-byte validation
- `.env.example` + `pydantic-settings`
- Health check details + request logging middleware
- Fix `index.html` title, remove MainframeLanding route

**Phase 6 (After — ~2–3 weeks):** Feature expansion
- Document preview/download API
- CSV/PDF evaluation report export
- Student mock exam mode
- Real-time OCR status via SSE
- Dashboard analytics with charts
- Dark mode toggle
- Multi-language OCR support

---

# 📜 License

MIT License

---

# 🤝 Contributing

Contributions are welcome! See the [PROJECT_ASSESSMENT.md](./PROJECT_ASSESSMENT.md) for the full execution plan.
