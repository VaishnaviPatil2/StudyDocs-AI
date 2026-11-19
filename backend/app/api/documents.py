"""Documents API: upload PDFs and retrieve document metadata."""
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Path, UploadFile, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.config import get_settings
from app.core.database import get_db
from app.models.course import Course
from app.schemas.document import DocumentResponse
from app.services.document_service import (
    get_document,
    list_documents_for_course,
    save_upload,
)
from app.services.ingestion_service import ingest_document

router = APIRouter(prefix="/courses/{course_id}/documents", tags=["Documents"])

settings = get_settings()

_ALLOWED_MIME = {"application/pdf"}
_MAX_BYTES = settings.max_upload_size_mb * 1024 * 1024


def _get_course_or_404(course_id: int, db: Session) -> Course:
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


@router.post(
    "",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a PDF document to a course",
)
def upload_document(
    course_id: int = Path(..., gt=0),
    file: UploadFile = File(..., description="PDF file to upload"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _get_course_or_404(course_id, db)

    # Validate mime type
    if file.content_type not in _ALLOWED_MIME:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Only PDF files are accepted. Got: {file.content_type}",
        )

    # Validate file size (read header; actual size checked after read in service)
    if file.size and file.size > _MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {settings.max_upload_size_mb} MB limit",
        )

    doc = save_upload(
        file=file,
        course_id=course_id,
        uploaded_by=int(current_user["sub"]),
        db=db,
    )

    # Kick off ingestion in the background (non-blocking for the HTTP response)
    background_tasks.add_task(ingest_document, doc, db)

    return doc


@router.get(
    "",
    response_model=list[DocumentResponse],
    summary="List all documents in a course",
)
def list_documents(
    course_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    _get_course_or_404(course_id, db)
    return list_documents_for_course(course_id, db)


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Get a single document by ID",
)
def get_document_detail(
    course_id: int = Path(..., gt=0),
    document_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    _get_course_or_404(course_id, db)
    doc = get_document(document_id, db)
    if not doc or doc.course_id != course_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return doc
