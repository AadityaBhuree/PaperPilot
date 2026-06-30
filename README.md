# 📄 PaperPilot

> **Fair. Explainable. AI-Powered Evaluation.**

PaperPilot is an open-source AI-powered exam evaluation and learning platform designed for both **teachers** and **students**.

It helps teachers reduce manual grading effort through explainable AI-assisted evaluation while helping students prepare for exams with detailed feedback, mock tests, and personalized learning insights.

---

# 🚀 Vision

Create a transparent, explainable, and accessible AI evaluation platform that:

* Reduces teacher workload
* Provides fair and unbiased evaluation
* Gives students meaningful feedback instead of only marks
* Supports handwritten and digital answer sheets
* Encourages learning through explanation rather than memorization

---

# 🏁 Getting Started

## Prerequisites

* **Python 3.10+**
* **Node.js 18+**
* **Google Gemini API key** — get one at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

## 1. Clone the repository

```bash
git clone https://github.com/your-username/PaperPilot.git
cd PaperPilot
```

## 2. Backend setup

```bash
# Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Run the backend
uvicorn backend.main:app --reload
```

The API docs are available at [http://localhost:8000/docs](http://localhost:8000/docs).

## 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The app is available at [http://localhost:5173](http://localhost:5173). API requests are proxied to the backend automatically.

## 4. Run tests

```bash
# Backend tests
PYTHONPATH=. python -m pytest backend/tests/ -v

# Frontend lint
cd frontend && npm run lint
```

---

# ✨ Features

## 👨‍🏫 Teacher Mode

* Create exams
* Upload question papers
* Upload answer keys
* Define grading rubrics
* Batch evaluate answer sheets
* AI-assisted grading
* Explainable mark deductions
* Teacher review and override
* Export reports

---

## 👨‍🎓 Student Mode (Planned)

* Take mock exams
* Upload handwritten answers
* AI evaluation
* Compare with ideal answers
* View missing concepts
* Track performance
* Personalized revision suggestions
* Weak-topic analysis

---

# 📄 Supported Input Formats

* PDF
* JPG
* JPEG
* PNG

Future:

* DOCX
* Multi-page scanned documents

---

# 🧠 Evaluation Pipeline

Upload Answer Sheet

↓

OCR & Document Processing

↓

Question Detection

↓

Answer Extraction

↓

Reference Answer Retrieval

↓

Rubric-Based AI Evaluation

↓

Explainable Score Generation

↓

Teacher Review

↓

Final Report

---

# 🎯 Core Principles

* Explainable AI
* Fair evaluation
* Human-in-the-loop review
* Rubric-based grading
* Transparent mark deductions
* Privacy-conscious design

---

# 🛠️ Planned Tech Stack

## Backend

* FastAPI
* Python

## AI

* Google Gemini
* LangChain
* Sentence Transformers

## OCR

* EasyOCR
* OpenCV

## Vector Search

* FAISS

## Database

* PostgreSQL
* SQLAlchemy

## Frontend

* React
* Tailwind CSS

---

# 📂 Proposed Project Structure

PaperPilot/

├── backend/

│ ├── api/

│ ├── evaluator/

│ ├── rag/

│ ├── ocr/

│ ├── database/

│ ├── models/

│ ├── uploads/

│ └── main.py

│

├── frontend/

├── docs/

├── tests/

├── README.md

└── requirements.txt

---

# 🗺️ Development Roadmap

## Phase 1

* File upload
* OCR integration
* Text extraction

## Phase 2

* Question detection
* Answer extraction
* Rubric support

## Phase 3

* AI evaluation engine
* Explainable scoring
* Confidence estimation

## Phase 4

* Teacher review interface
* Report generation

## Phase 5

* Student mock exams
* Personalized feedback
* Progress tracking

## Phase 6

* Analytics
* Batch evaluation
* Dashboard
* Multi-language support

---

# 🤝 Contributing

Contributions, suggestions, bug reports, and feature requests are welcome.

PaperPilot aims to become a community-driven educational project that promotes fair and explainable AI-assisted evaluation.

---

# 📜 License

MIT License

---

# 💡 Long-Term Goal

Build a free and open platform where:

* Teachers spend less time grading.
* Students receive instant, explainable feedback.
* AI assists educators without replacing human judgment.
* Learning becomes more transparent and accessible for everyone.
