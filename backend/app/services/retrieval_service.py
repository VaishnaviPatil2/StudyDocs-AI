"""
Vector similarity retrieval using pgvector.

Uses cosine distance (<=>) operator from the pgvector extension to find
the top-k most semantically similar chunks to a user's query.
"""
import logging
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.document_chunk import DocumentChunk
from app.services.embedding_service import embed_query

logger = logging.getLogger(__name__)
settings = get_settings()


def retrieve_similar_chunks(
    query: str,
    db: Session,
    course_id: int | None = None,
    document_id: int | None = None,
    top_k: int | None = None,
) -> list[DocumentChunk]:
    """
    Embed the query and find the top-k most similar document chunks.

    Filtering:
    - If course_id is given, search only within that course's documents.
    - If document_id is given, search only within that document.
    - Both can be combined.

    Returns chunks ordered by cosine similarity (most similar first).
    """
    k = top_k or settings.retrieval_top_k
    query_vector = embed_query(query)
    # Format as a pgvector literal: '[0.1, 0.2, ...]'
    vector_literal = "[" + ",".join(str(v) for v in query_vector) + "]"

    q = db.query(DocumentChunk)

    if document_id is not None:
        q = q.filter(DocumentChunk.document_id == document_id)
    elif course_id is not None:
        # Join through documents to filter by course
        from app.models.document import Document  # local import avoids circular
        q = q.join(Document, DocumentChunk.document_id == Document.id).filter(
            Document.course_id == course_id
        )

    # Order by cosine distance (ascending = most similar first)
    q = q.order_by(
        text(f"embedding <=> '{vector_literal}'::vector")
    ).limit(k)

    chunks = q.all()
    logger.info("Retrieved %d chunks for query: %.60s...", len(chunks), query)
    return chunks
