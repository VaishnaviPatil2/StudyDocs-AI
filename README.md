# StudyDocs AI

An AI-powered document Q&A system built with **RAG (Retrieval-Augmented Generation)**. Upload PDF study material, ask questions, and get answers grounded in your documents with source citations.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12 + FastAPI |
| ORM | SQLAlchemy 2.x |
| Database | PostgreSQL 16 + pgvector |
| Migrations | Alembic |
| Auth | JWT (HS256) + pwdlib (Argon2) |
| PDF extraction | pypdf |
| Chunking | LangChain RecursiveCharacterTextSplitter |
| Embeddings | BAAI/bge-small-en-v1.5 (384-dim, local) |
| Vector search | pgvector cosine similarity |
| LLM | Groq (Llama 3 8B) via langchain-groq |
| Frontend | React 18 + Vite + TypeScript *(in progress)* |
| UI | Tailwind CSS + shadcn/ui *(in progress)* |
| Cache/Queue | Redis + Celery *(in progress)* |

---

## How RAG Works in This Project

```
PDF Upload
    │
    ▼
Text Extraction (pypdf, page by page)
    │
    ▼
Chunking (500 chars, 50 overlap — RecursiveCharacterTextSplitter)
    │
    ▼
Embedding (BAAI/bge-small-en-v1.5 — 384-dim vectors)
    │
    ▼
Store in PostgreSQL (pgvector column, IVFFlat index)
    │
    ▼
User asks a question
    │
    ▼
Embed query → cosine similarity search → top-5 chunks
    │
    ▼
Send chunks + question to Groq (Llama 3)
    │
    ▼
Answer + source citations (document title + page number)
```

---

## Project Structure

```
StudyDocs-AI/
├── backend/
│   ├── alembic/                  # Database migrations
│   │   └── versions/
│   ├── app/
│   │   ├── api/                  # FastAPI route handlers
│   │   │   ├── auth.py           # POST /api/v1/auth/login
│   │   │   ├── users.py          # POST /api/v1/users, GET /api/v1/users/me
│   │   │   ├── courses.py        # CRUD /api/v1/courses
│   │   │   ├── documents.py      # PDF upload /api/v1/courses/{id}/documents
│   │   │   ├── query.py          # RAG query /api/v1/courses/{id}/query
│   │   │   └── dependencies.py   # JWT auth dependencies
│   │   ├── core/
│   │   │   ├── config.py         # pydantic-settings — all env vars
│   │   │   ├── database.py       # SQLAlchemy engine + get_db()
│   │   │   └── security.py       # password hash + JWT helpers
│   │   ├── models/               # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── course.py
│   │   │   ├── document.py       # Document + status enum
│   │   │   └── document_chunk.py # Chunk + 384-dim vector column
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   ├── services/             # Business logic (no DB in controllers)
│   │   │   ├── auth_service.py
│   │   │   ├── document_service.py  # file save, status updates
│   │   │   ├── pdf_processor.py     # extract + chunk PDF
│   │   │   ├── embedding_service.py # BGE model, lazy-loaded singleton
│   │   │   ├── ingestion_service.py # pipeline: pdf → embed → DB
│   │   │   ├── retrieval_service.py # pgvector cosine search
│   │   │   └── rag_service.py       # retrieval + LLM → answer
│   │   └── main.py               # App factory, routers, CORS
│   ├── uploads/                  # Uploaded PDFs (gitignored)
│   ├── requirements.txt
│   └── alembic.ini
├── frontend/                     # React + Vite (in progress)
├── docker-compose.yml            # PostgreSQL + Redis
├── .env.example                  # Copy to .env and fill in values
└── README.md
```

---

## Quick Start

### Prerequisites
- Python 3.12+
- Docker Desktop (for PostgreSQL + Redis)
- A free [Groq API key](https://console.groq.com)

### 1. Clone and configure

```bash
git clone https://github.com/VaishnaviPatil2/StudyDocs-AI.git
cd StudyDocs-AI
cp .env.example .env
# Edit .env — set GROQ_API_KEY and change passwords
```

### 2. Start the database

```bash
docker compose up -d
```

### 3. Set up the backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### 4. Run migrations

```bash
alembic upgrade head
```

### 5. Start the server

```bash
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | No | Health check |
| GET | `/health` | No | Health check |
| POST | `/api/v1/users` | No | Register |
| POST | `/api/v1/auth/login` | No | Login → JWT |
| GET | `/api/v1/users/me` | JWT | My profile |
| POST | `/api/v1/courses` | JWT (admin) | Create course |
| GET | `/api/v1/courses` | JWT | List courses |
| POST | `/api/v1/courses/{id}/documents` | JWT | Upload PDF |
| GET | `/api/v1/courses/{id}/documents` | JWT | List documents |
| GET | `/api/v1/courses/{id}/documents/{doc_id}` | JWT | Document detail |
| **POST** | **`/api/v1/courses/{id}/query`** | **JWT** | **Ask a question (RAG)** |

---

## Environment Variables

See `.env.example` for all variables. The minimum required:

| Variable | Description |
|---|---|
| `POSTGRES_*` | Database connection |
| `JWT_SECRET_KEY` | Sign tokens — generate with `secrets.token_urlsafe(32)` |
| `GROQ_API_KEY` | Free at [console.groq.com](https://console.groq.com) |

---

## Branches (build history)

| Branch | What was built |
|---|---|
| `fix/dependencies-and-cleanup` | Add pwdlib, pydantic-settings; clean structure; /api/v1 prefix |
| `feat/document-model` | Document + DocumentChunk models; pgvector migration |
| `feat/pdf-upload` | PDF upload API; file storage; document CRUD |
| `feat/pdf-processing` | pypdf extraction; LangChain chunking service |
| `feat/embeddings-and-vector-store` | BGE embeddings; ingestion pipeline; background processing |
| `feat/rag-query` | Vector retrieval; Groq LLM; RAG query API with citations |
| `feat/readme-and-env-example` | This README + .env.example |
