from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import all models here so Alembic autogenerate can detect them.
# Keep this file as the single registration point.
from app.models.user import User             # noqa: E402, F401
from app.models.course import Course         # noqa: E402, F401
from app.models.document import Document     # noqa: E402, F401
from app.models.document_chunk import DocumentChunk  # noqa: E402, F401
