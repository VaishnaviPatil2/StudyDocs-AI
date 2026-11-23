"""
Embedding service using BAAI/bge-small-en-v1.5 via HuggingFace transformers
directly — no sentence-transformers, no scipy, no sklearn dependency.

Falls back to a deterministic hash-based mock if the model cannot load,
so the app starts cleanly regardless.
"""
from __future__ import annotations

import hashlib
import logging
import math
from functools import lru_cache

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_DIM = 384
_MODEL_NAME = "BAAI/bge-small-en-v1.5"


# ── helpers ──────────────────────────────────────────────────────────────────

def _normalize(v: list[float]) -> list[float]:
    norm = math.sqrt(sum(x * x for x in v))
    return [x / norm for x in v] if norm > 0 else v


def _mock_embed(text: str) -> list[float]:
    """Deterministic 384-dim unit vector from SHA-256 — used as fallback."""
    raw: list[float] = []
    seed = hashlib.sha256(text.encode()).digest()
    while len(raw) < _DIM:
        seed = hashlib.sha256(seed).digest()
        raw.extend(
            int.from_bytes(seed[i:i + 4], "big") / 2 ** 32
            for i in range(0, 32, 4)
        )
    return _normalize(raw[:_DIM])


# ── model loading ─────────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _load_model():
    """
    Load BGE model using transformers AutoModel + AutoTokenizer.
    Returns (tokenizer, model) or None on failure.
    """
    try:
        import torch  # noqa: F401 — verify torch works first
        from transformers import AutoModel, AutoTokenizer  # type: ignore
    except Exception as exc:
        logger.warning("Cannot load embedding model (%s) — using mock", exc)
        return None

    try:
        logger.info("Loading %s …", _MODEL_NAME)
        tokenizer = AutoTokenizer.from_pretrained(_MODEL_NAME)
        model = AutoModel.from_pretrained(_MODEL_NAME)
        model.eval()
        logger.info("Embedding model loaded")
        return tokenizer, model
    except Exception as exc:
        logger.warning("Model load failed (%s) — using mock", exc)
        return None


# ── public API ────────────────────────────────────────────────────────────────

def _encode_batch(texts: list[str]) -> list[list[float]]:
    result = _load_model()
    if result is None:
        logger.warning("Using mock embeddings — model not available")
        return [_mock_embed(t) for t in texts]

    tokenizer, model = result

    try:
        import torch

        encoded = tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=512,
            return_tensors="pt",
        )
        with torch.no_grad():
            output = model(**encoded)

        # Mean pooling over token embeddings
        token_embeddings = output.last_hidden_state          # (B, T, 384)
        attention_mask = encoded["attention_mask"]           # (B, T)
        mask = attention_mask.unsqueeze(-1).float()
        mean_pooled = (token_embeddings * mask).sum(1) / mask.sum(1)

        return [_normalize(v.tolist()) for v in mean_pooled]
    except Exception as exc:
        logger.warning("Encode failed (%s) — using mock", exc)
        return [_mock_embed(t) for t in texts]


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed document passages. Returns normalized 384-dim vectors."""
    if not texts:
        return []
    prefixed = [f"Represent this sentence: {t}" for t in texts]
    return _encode_batch(prefixed)


def embed_query(query: str) -> list[float]:
    """Embed a search query. Returns a normalized 384-dim vector."""
    prefixed = f"Represent this question for searching relevant passages: {query}"
    return _encode_batch([prefixed])[0]
