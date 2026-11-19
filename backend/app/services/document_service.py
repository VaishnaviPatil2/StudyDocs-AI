"""Document service: handles file saving, DB record creation, and status updates."""
import os
import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.document import Document, DocumentStatus

settings = get_settings()


def _get_upload_path(course_id: int) -> Path:
    """Return (and create) the upload directory for a course."""
    path = Path(settings.upload_dir) / str(course_id)
    path.mkdir(parents=True, exist_ok=True)
    return path


def save_upload(
    file: UploadFile,
    course_id: int,
    uploaded_by: int,
    db: Session,
) -> Document:
    """
    Persist the uploaded file to disk, create a DB record, and return it.
    File is stored at: uploads/<course_id>/<uuid>_<original_name>
    """
    upload_dir = _get_upload_path(course_id)
    unique_name = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = upload_dir / unique_name

    # Stream write — avoids loading entire file into memory
    contents = file.file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    doc = Document(
        course_id=course_id,
        uploaded_by=uploaded_by,
        title=file.filename or unique_name,
        file_path=str(file_path),
        file_size_bytes=len(contents),
        status=DocumentStatus.PENDING,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def get_document(doc_id: int, db: Session) -> Document | None:
    return db.query(Document).filter(Document.id == doc_id).first()


def list_documents_for_course(course_id: int, db: Session) -> list[Document]:
    return (
        db.query(Document)
        .filter(Document.course_id == course_id)
        .order_by(Document.id)
        .all()
    )


def set_status(
    doc: Document,
    status: DocumentStatus,
    db: Session,
    error_message: str | None = None,
) -> None:
    doc.status = status
    doc.error_message = error_message
    db.commit()
