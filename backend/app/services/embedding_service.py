"""
Embedding service using BAAI/bge-small-en-v1.5 (384-dimensional).

The model is loaded once and cached (lazy singleton).
BGE models perform better with the query prefix "Represent this sentence:".
"""
from __future__ import annotations

import logging
from functools import lru_cache
from typing import TYPE_CHECKING

from app.core.config import get_settings

if TYPE_CHECKING:
    from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)
settings = get_settings()


@lru_cache(maxsize=1)
def _load_model() -> "SentenceTransformer":
    """Load the BGE model once and cache it for the process lifetime."""
    try:
        from sentence_transformers import SentenceTransformer  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "sentence-transformers is not installed. "
            "Run: pip install sentence-transformers"
        ) from exc

    logger.info("Loading embedding model: %s", settings.embedding_model)
    model = SentenceTransformer(settings.embedding_model)
    logger.info("Embedding model loaded (dim=%d)", settings.embedding_dimension)
    return model


def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Embed a list of text strings.
    Returns a list of float vectors, one per input text.
    """
    model = _load_model()
    # BGE requires a prefix for passage (document) encoding
    prefixed = [f"Represent this sentence: {t}" for t in texts]
    embeddings = model.encode(
        prefixed,
        normalize_embeddings=True,  # cosine similarity works on unit vectors
        show_progress_bar=False,
        batch_size=32,
    )
    return embeddings.tolist()


def embed_query(query: str) -> list[float]:
    """
    Embed a single search query.
    BGE uses a different prefix for queries.
    """
    model = _load_model()
    prefixed = f"Represent this question for searching relevant passages: {query}"
    embedding = model.encode(
        [prefixed],
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    return embedding[0].tolist()
