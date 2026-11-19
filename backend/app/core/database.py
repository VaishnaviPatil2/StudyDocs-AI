from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,       # drop stale connections automatically
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


def get_db():
    """FastAPI dependency: yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
