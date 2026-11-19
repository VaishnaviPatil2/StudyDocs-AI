from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    question: str = Field(
        min_length=5,
        max_length=1000,
        description="The question to ask about the uploaded documents",
        examples=["What is the main topic of this document?"],
    )
    document_id: int | None = Field(
        default=None,
        description="Restrict search to a specific document (optional)",
    )


class SourceCitationResponse(BaseModel):
    document_id: int
    document_title: str
    page_number: int | None
    chunk_excerpt: str


class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceCitationResponse]
    model: str
    question: str
