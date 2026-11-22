"""
RAG (Retrieval-Augmented Generation) service.

Retrieves relevant document chunks and sends them to the Groq LLM
(Llama 3) with a structured prompt to generate a grounded answer
with source citations.
"""
import logging
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.document_chunk import DocumentChunk
from app.services.retrieval_service import retrieve_similar_chunks

logger = logging.getLogger(__name__)
settings = get_settings()

# ── Prompt template ───────────────────────────────────────────────────────────
_SYSTEM_PROMPT = """You are StudyDocs AI, an expert assistant that answers questions \
based strictly on the provided document excerpts.

Rules:
- Answer only using the context provided below.
- If the context does not contain enough information, say: \
  "I could not find a definitive answer in the uploaded documents."
- Do NOT use any knowledge from outside the provided context.
- Always cite the source (document title + page number) at the end of your answer.
- Be concise and clear."""

_HUMAN_TEMPLATE = """Context from uploaded documents:
{context}

Question: {question}

Answer (with citations):"""


@dataclass
class SourceCitation:
    document_id: int
    document_title: str
    page_number: int | None
    chunk_excerpt: str  # first 120 chars


@dataclass
class RAGResponse:
    answer: str
    sources: list[SourceCitation]
    model: str


def _build_context(chunks: list[DocumentChunk], db: Session) -> tuple[str, list[SourceCitation]]:
    """Format retrieved chunks into the LLM context string and source list."""
    from app.models.document import Document

    context_parts: list[str] = []
    sources: list[SourceCitation] = []

    for i, chunk in enumerate(chunks, start=1):
        doc = db.get(Document, chunk.document_id)
        doc_title = doc.title if doc else f"Document {chunk.document_id}"
        page_ref = f"Page {chunk.page_number}" if chunk.page_number else "Unknown page"

        context_parts.append(
            f"[{i}] Source: {doc_title} — {page_ref}\n{chunk.content}"
        )

        sources.append(
            SourceCitation(
                document_id=chunk.document_id,
                document_title=doc_title,
                page_number=chunk.page_number,
                chunk_excerpt=chunk.content[:120],
            )
        )

    return "\n\n---\n\n".join(context_parts), sources


def _call_groq(context: str, question: str) -> str:
    """Call Groq API using the official groq SDK and return the answer string."""
    try:
        from groq import Groq  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "groq SDK is not installed. Run: pip install groq"
        ) from exc

    client = Groq(api_key=settings.groq_api_key)

    completion = client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {
                "role": "user",
                "content": _HUMAN_TEMPLATE.format(
                    context=context, question=question
                ),
            },
        ],
        temperature=0.2,
        max_tokens=1024,
    )

    return completion.choices[0].message.content


def answer_question(
    question: str,
    db: Session,
    course_id: int | None = None,
    document_id: int | None = None,
) -> RAGResponse:
    """
    Full RAG pipeline:
    1. Retrieve top-k relevant chunks via vector similarity
    2. Build a structured context string with citations
    3. Send to Groq LLM and return the answer + sources
    """
    chunks = retrieve_similar_chunks(
        query=question,
        db=db,
        course_id=course_id,
        document_id=document_id,
    )

    if not chunks:
        return RAGResponse(
            answer="No relevant content found in the uploaded documents for your question.",
            sources=[],
            model=settings.groq_model,
        )

    context, sources = _build_context(chunks, db)
    answer = _call_groq(context, question)

    return RAGResponse(answer=answer, sources=sources, model=settings.groq_model)
