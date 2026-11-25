from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.courses import router as courses_router
from app.api.documents import router as documents_router
from app.api.query import router as query_router
from app.api.users import router as users_router
from app.core.config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-load BGE embedding model on startup so first query is not slow
    import logging
    logger = logging.getLogger(__name__)
    try:
        from app.services.embedding_service import embed_query
        import asyncio
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, embed_query, "startup warmup")
        logger.info("BGE embedding model pre-loaded successfully")
    except Exception as exc:
        logger.warning("BGE model pre-load failed (%s) — will load on first query", exc)
    yield
    # shutdown


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered document Q&A system using RAG (Retrieval-Augmented Generation)",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router,      prefix="/api/v1")
app.include_router(users_router,     prefix="/api/v1")
app.include_router(courses_router,   prefix="/api/v1")
app.include_router(documents_router, prefix="/api/v1")
app.include_router(query_router,     prefix="/api/v1")


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "app": settings.app_name, "version": settings.app_version}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
