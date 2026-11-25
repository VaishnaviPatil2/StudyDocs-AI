"""RAG Query API — the core AI endpoint of StudyDocs."""
from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.course import Course
from app.schemas.query import QueryRequest, QueryResponse, SourceCitationResponse
from app.services.rag_service import ChatMessage, answer_question

router = APIRouter(prefix="/courses/{course_id}/query", tags=["RAG Query"])


@router.post(
    "",
    response_model=QueryResponse,
    summary="Ask a question about documents in a course",
)
def query_course(
    course_id: int = Path(..., gt=0),
    payload: QueryRequest = ...,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    # Convert history items to ChatMessage objects
    history = [ChatMessage(role=h.role, content=h.content) for h in payload.history]

    # Detect summary/overview questions — retrieve all chunks
    summary_keywords = {"summarise", "summarize", "summary", "main topics",
                        "key points", "overview", "examples", "all topics",
                        "what does", "what is covered", "what are the main"}
    q_lower = payload.question.lower()
    is_summary = any(kw in q_lower for kw in summary_keywords)
    top_k = None if is_summary else None  # None uses config default

    result = answer_question(
        question=payload.question,
        db=db,
        course_id=course_id,
        document_id=payload.document_id,
        history=history,
        top_k=20 if is_summary else None,
    )

    return QueryResponse(
        answer=result.answer,
        sources=[
            SourceCitationResponse(
                document_id=s.document_id,
                document_title=s.document_title,
                page_number=s.page_number,
                chunk_excerpt=s.chunk_excerpt,
            )
            for s in result.sources
        ],
        model=result.model,
        question=payload.question,
        rewritten_query=result.rewritten_query,
    )
