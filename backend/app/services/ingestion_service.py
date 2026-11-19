"""
Ingestion pipeline: connects the PDF processor, embedding service,
and database to fully process an uploaded document.

Flow:
  1. Set document status → processing
  2. Extract + chunk PDF text
  3. Batch embed chunks
  4. Persist DocumentChunk rows with embeddings
  5. Update document: status=ready, page_count
  On any error: status=failed + error_message
"""
import logging

from sqlalchemy.orm import Session

from app.models.document import Document, DocumentStatus
from app.models.document_chunk import DocumentChunk
from app.services.document_service import set_status
from app.services.embedding_service import embed_texts
from app.services.pdf_processor import process_pdf

logger = logging.getLogger(__name__)


def ingest_document(doc: Document, db: Session) -> None:
    """
    Run the full ingestion pipeline for a Document record.
    This is intentionally synchronous so it can run in a Celery worker
    or be called directly from an API endpoint (for local dev without Celery).
    """
    logger.info("Starting ingestion for document id=%d title=%s", doc.id, doc.title)

    # Step 1: mark as processing
    set_status(doc, DocumentStatus.PROCESSING, db)

    try:
        # Step 2: extract text and chunk
        chunks, total_pages = process_pdf(doc.file_path)
        logger.info(
            "Document id=%d: %d pages, %d chunks", doc.id, total_pages, len(chunks)
        )

        if not chunks:
            raise ValueError("No extractable text found in the PDF")

        # Step 3: embed all chunks (batch for efficiency)
        texts = [c.content for c in chunks]
        embeddings = embed_texts(texts)
        logger.info("Document id=%d: embeddings generated", doc.id)

        # Step 4: persist chunks to DB
        db_chunks = [
            DocumentChunk(
                document_id=doc.id,
                chunk_index=chunk.chunk_index,
                content=chunk.content,
                page_number=chunk.page_number,
                embedding=embedding,
            )
            for chunk, embedding in zip(chunks, embeddings)
        ]
        # Step 4: persist chunks to DB using add_all (SQLAlchemy 2.x standard)
        db.add_all(db_chunks)

        # Step 5: mark document as ready
        doc.page_count = total_pages
        doc.status = DocumentStatus.READY
        doc.error_message = None
        db.commit()
        logger.info("Document id=%d ingestion complete", doc.id)

    except Exception as exc:
        db.rollback()
        logger.exception("Ingestion failed for document id=%d: %s", doc.id, exc)
        set_status(doc, DocumentStatus.FAILED, db, error_message=str(exc))
        raise
