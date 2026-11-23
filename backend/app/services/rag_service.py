"""
RAG (Retrieval-Augmented Generation) service.

Retrieves relevant document chunks and sends them to the Groq LLM
with a tightened system prompt that:
  - Prevents hallucinating facts not in the context
  - Allows code reasoning
  - Rewrites follow-up questions into standalone questions before retrieval
"""
import logging
from dataclasses import dataclass, field

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.document_chunk import DocumentChunk
from app.services.retrieval_service import retrieve_similar_chunks

logger = logging.getLogger(__name__)
settings = get_settings()


# ── System prompt ─────────────────────────────────────────────────────────────
_SYSTEM_PROMPT = """\
You are StudyDocs AI, a precise assistant that answers questions using ONLY the
document excerpts provided in the context below.

Strict rules:
1. Use ONLY information that appears in the provided context. Do not add facts,
   methods, examples, or explanations that are not explicitly stated in the context,
   even if you know them from general knowledge.
2. If the context contains code, trace through it and reason about its output or
   behaviour to answer the question. Code reasoning from provided snippets is allowed.
3. If a question has multiple parts, answer each part separately:
   - If a part is answered in the context, answer it.
   - If a part is NOT in the context, say exactly:
     "I could not find [that specific part] in the uploaded documents."
4. NEVER say "I could not find a definitive answer" for facts that ARE in the context.
   Re-read the context carefully before concluding something is missing.
5. For true/false or yes/no questions where the context contradicts the premise,
   say No/Yes and explain using the context.
6. Always cite the source document and page number at the end of your answer.
7. Keep answers concise and factual. Do not pad with general knowledge."""

_HUMAN_TEMPLATE = """\
Context from uploaded documents:
{context}

Question: {question}

Answer (cite sources, use ONLY the context above):"""

# ── Query rewriter prompt ─────────────────────────────────────────────────────
_REWRITE_SYSTEM = """\
You are a query rewriter. Given a conversation history and a follow-up message,
rewrite the follow-up into a single, self-contained search query that makes sense
without the conversation history. Output ONLY the rewritten query, nothing else."""

_REWRITE_TEMPLATE = """\
Conversation history:
{history}

Follow-up message: {question}

Rewritten standalone query:"""


@dataclass
class SourceCitation:
    document_id: int
    document_title: str
    page_number: int | None
    chunk_excerpt: str


@dataclass
class RAGResponse:
    answer: str
    sources: list[SourceCitation]
    model: str
    rewritten_query: str = ""


@dataclass
class ChatMessage:
    role: str   # "user" or "assistant"
    content: str


def _call_groq(messages: list[dict], temperature: float = 0.1, max_tokens: int = 1024) -> str:
    try:
        from groq import Groq  # type: ignore
    except ImportError as exc:
        raise RuntimeError("groq SDK not installed — run: pip install groq") from exc

    client = Groq(api_key=settings.groq_api_key)
    completion = client.chat.completions.create(
        model=settings.groq_model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return completion.choices[0].message.content or ""


def _rewrite_query(question: str, history: list[ChatMessage]) -> str:
    """
    Rewrite a follow-up question into a standalone query using conversation history.
    Returns the original question if no history or rewriting fails.
    """
    if not history:
        return question

    # Only use last 4 turns to keep it focused
    recent = history[-4:]
    history_text = "\n".join(
        f"{m.role.capitalize()}: {m.content}" for m in recent
    )

    try:
        rewritten = _call_groq(
            messages=[
                {"role": "system", "content": _REWRITE_SYSTEM},
                {"role": "user", "content": _REWRITE_TEMPLATE.format(
                    history=history_text, question=question
                )},
            ],
            temperature=0.0,
            max_tokens=100,
        )
        rewritten = rewritten.strip().strip('"').strip("'")
        logger.info("Query rewritten: '%s' → '%s'", question, rewritten)
        return rewritten if rewritten else question
    except Exception as exc:
        logger.warning("Query rewrite failed (%s) — using original", exc)
        return question


def _build_context(
    chunks: list[DocumentChunk], db: Session
) -> tuple[str, list[SourceCitation]]:
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
        sources.append(SourceCitation(
            document_id=chunk.document_id,
            document_title=doc_title,
            page_number=chunk.page_number,
            chunk_excerpt=chunk.content[:150],
        ))

    return "\n\n---\n\n".join(context_parts), sources


def answer_question(
    question: str,
    db: Session,
    course_id: int | None = None,
    document_id: int | None = None,
    history: list[ChatMessage] | None = None,
) -> RAGResponse:
    """
    Full RAG pipeline with query rewriting for follow-up questions.

    1. Rewrite question using conversation history (if any)
    2. Retrieve top-k chunks via vector similarity
    3. Build context string
    4. Call Groq LLM with strict grounded-answer prompt
    5. Return answer + sources
    """
    history = history or []

    # Step 1: rewrite follow-up into standalone query for retrieval
    search_query = _rewrite_query(question, history)

    # Step 2: retrieve
    chunks = retrieve_similar_chunks(
        query=search_query,
        db=db,
        course_id=course_id,
        document_id=document_id,
    )

    if not chunks:
        return RAGResponse(
            answer="No relevant content found in the uploaded documents for your question.",
            sources=[],
            model=settings.groq_model,
            rewritten_query=search_query,
        )

    # Step 3: build context
    context, sources = _build_context(chunks, db)

    # Step 4: answer — use the ORIGINAL question (not rewritten) so the answer
    # directly addresses what the user asked
    answer = _call_groq(
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": _HUMAN_TEMPLATE.format(
                context=context, question=question
            )},
        ],
        temperature=0.1,
        max_tokens=1024,
    )

    return RAGResponse(
        answer=answer,
        sources=sources,
        model=settings.groq_model,
        rewritten_query=search_query,
    )
