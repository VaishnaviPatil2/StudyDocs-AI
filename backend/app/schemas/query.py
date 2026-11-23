from pydantic import BaseModel, Field


class ChatHistoryItem(BaseModel):
    role: str = Field(description="'user' or 'assistant'")
    content: str


class QueryRequest(BaseModel):
    question: str = Field(
        min_length=1,
        max_length=2000,
        description="The question to ask about the uploaded documents",
    )
    document_id: int | None = Field(
        default=None,
        description="Restrict search to a specific document (optional)",
    )
    history: list[ChatHistoryItem] = Field(
        default_factory=list,
        description="Previous conversation turns for follow-up question rewriting",
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
    rewritten_query: str = ""
