from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

# pgvector type — imported lazily to avoid hard crash if pgvector not yet installed
try:
    from pgvector.sqlalchemy import Vector
    _vector_type = Vector
except ImportError:  # pragma: no cover
    _vector_type = None  # type: ignore


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    chunk_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Zero-based position of this chunk within the document",
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Raw text of this chunk",
    )

    page_number: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        comment="Source page number in the original PDF",
    )

    # 384-dimensional vector for BAAI/bge-small-en-v1.5
    embedding: Mapped[list | None] = mapped_column(
        _vector_type(384) if _vector_type else Text,
        nullable=True,
        comment="BGE-small-en-v1.5 embedding vector",
    )

    # Relationship back to parent document
    document: Mapped["Document"] = relationship(  # type: ignore[name-defined]
        "Document",
        back_populates="chunks",
    )
