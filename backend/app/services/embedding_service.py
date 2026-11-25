"""
Embedding service using BAAI/bge-small-en-v1.5 (384-dimensional).
Uses sentence-transformers with the real BGE model for semantic search.
The model is loaded once and cached (lazy singleton).
"""
from __future__ import annotations

import logging
from functools import lru_cache

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


@lru_cache(maxsize=1)
def _load_model():
    """Load the BGE model once and cache it for the process lifetime."""
    import warnings
    warnings.filterwarnings("ignore")
    try:
        from sentence_transformers import SentenceTransformer  # type: ignore
        logger.info("Loading embedding model: %s", settings.embedding_model)
        model = SentenceTransformer(settings.embedding_model)
        logger.info("Embedding model loaded (dim=%d)", settings.embedding_dimension)
        return model
    except Exception as exc:
        logger.warning("Cannot load BGE model (%s) — using mock embeddings", exc)
        return None


def _mock_embed(text: str) -> list[float]:
    """Hash-based deterministic fallback when model is unavailable."""
    import hashlib, math
    DIM = 384
    raw: list[float] = []
    seed = hashlib.sha256(text.encode()).digest()
    while len(raw) < DIM:
        seed = hashlib.sha256(seed).digest()
        raw.extend(int.from_bytes(seed[i:i+4], "big") / 2**32 for i in range(0, 32, 4))
    vec = raw[:DIM]
    norm = math.sqrt(sum(x * x for x in vec))
    return [x / norm for x in vec] if norm > 0 else vec


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed document passages. Returns normalized 384-dim vectors."""
    if not texts:
        return []
    model = _load_model()
    if model is None:
        return [_mock_embed(t) for t in texts]
    import warnings
    warnings.filterwarnings("ignore")
    prefixed = [f"Represent this sentence: {t}" for t in texts]
    vectors = model.encode(
        prefixed,
        normalize_embeddings=True,
        show_progress_bar=False,
        batch_size=32,
    )
    return vectors.tolist()


def embed_query(query: str) -> list[float]:
    """Embed a search query. Returns a normalized 384-dim vector."""
    model = _load_model()
    if model is None:
        return _mock_embed(query)
    import warnings
    warnings.filterwarnings("ignore")
    prefixed = f"Represent this question for searching relevant passages: {query}"
    vector = model.encode(
        [prefixed],
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    return vector[0].tolist()
