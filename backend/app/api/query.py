"""
RAG Query API — the core AI endpoint of StudyDocs.

POST /api/v1/courses/{course_id}/query
  - Authenticates the user
  - Accepts a question + optional document_id filter
  - Retrieves relevant chunks from pgvector
  - Calls Groq LLM with retrieved context
  - Returns answer + source citations
"""
from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.course import Course
from app.schemas.query import QueryRequest, QueryResponse
from app.services.rag_service import answer_question

router = APIRouter(prefix="/courses/{course_id}/query", tags=["RAG Query"])


@router.post(
    "",
    response_model=QueryResponse,
    summary="Ask a question about documents in a course",
    description=(
        "Retrieves the most semantically relevant document chunks "
        "and uses an LLM to generate a grounded answer with source citations."
    ),
)
def query_course(
    course_id: int = Path(..., gt=0, description="Course to search within"),
    payload: QueryRequest = ...,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    # Verify course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    result = answer_question(
        question=payload.question,
        db=db,
        course_id=course_id,
        document_id=payload.document_id,
    )

    return QueryResponse(
        answer=result.answer,
        sources=[
            {
                "document_id": s.document_id,
                "document_title": s.document_title,
                "page_number": s.page_number,
                "chunk_excerpt": s.chunk_excerpt,
            }
            for s in result.sources
        ],
        model=result.model,
        question=payload.question,
    )
