# This file registers all ORM models so Alembic autogenerate can detect them.
# Import order matters: Base first, then all models.
from app.models.base import Base  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.course import Course  # noqa: F401
from app.models.document import Document  # noqa: F401
from app.models.document_chunk import DocumentChunk  # noqa: F401
