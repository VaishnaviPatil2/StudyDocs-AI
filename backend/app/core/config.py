from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[3] / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ───────────────────────────────────────────────────────────────────
    app_name: str = "StudyDocs AI API"
    app_version: str = "0.1.0"
    debug: bool = False

    # ── Database ──────────────────────────────────────────────────────────────
    postgres_user: str
    postgres_password: str
    postgres_host: str = "localhost"
    postgres_port: int = 5433
    postgres_db: str

    @property
    def database_url(self) -> str:
        # Build URL without the password — password is passed via connect_args
        # to avoid URL-encoding issues with special characters (e.g. @ in password)
        return (
            f"postgresql+psycopg://{self.postgres_user}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def db_connect_args(self) -> dict:
        """Pass password directly to psycopg to avoid URL-encoding issues."""
        return {"password": self.postgres_password}

    # ── JWT ───────────────────────────────────────────────────────────────────
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30

    # ── File upload ───────────────────────────────────────────────────────────
    upload_dir: str = "uploads"
    max_upload_size_mb: int = 50

    # ── AI / Embeddings ───────────────────────────────────────────────────────
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    embedding_dimension: int = 384
    chunk_size: int = 500
    chunk_overlap: int = 50
    retrieval_top_k: int = 5

    # ── Groq LLM ─────────────────────────────────────────────────────────────
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-20b"

    # ── Redis ─────────────────────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"


@lru_cache
def get_settings() -> Settings:
    return Settings()
