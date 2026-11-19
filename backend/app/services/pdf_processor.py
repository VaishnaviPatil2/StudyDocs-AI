"""
PDF processing pipeline:
  1. Extract text from each page via pypdf
  2. Split into overlapping chunks with LangChain's RecursiveCharacterTextSplitter
  3. Return a list of raw chunk dicts ready to be persisted
"""
from dataclasses import dataclass
from pathlib import Path

from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader

from app.core.config import get_settings

settings = get_settings()


@dataclass
class RawChunk:
    """Single text chunk extracted from a PDF."""
    content: str
    page_number: int    # 1-based page number from the source document
    chunk_index: int    # 0-based position within this document


def extract_text_by_page(file_path: str | Path) -> list[tuple[int, str]]:
    """
    Read every page of a PDF and return a list of (page_number, text) tuples.
    page_number is 1-based.
    """
    reader = PdfReader(str(file_path))
    pages: list[tuple[int, str]] = []
    for i, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        text = text.strip()
        if text:
            pages.append((i, text))
    return pages


def chunk_pages(pages: list[tuple[int, str]]) -> list[RawChunk]:
    """
    Split each page's text into overlapping chunks using
    RecursiveCharacterTextSplitter.  Preserves the page number for citation.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
        length_function=len,
    )

    chunks: list[RawChunk] = []
    chunk_index = 0

    for page_num, page_text in pages:
        splits = splitter.split_text(page_text)
        for split in splits:
            split = split.strip()
            if split:
                chunks.append(
                    RawChunk(
                        content=split,
                        page_number=page_num,
                        chunk_index=chunk_index,
                    )
                )
                chunk_index += 1

    return chunks


def process_pdf(file_path: str | Path) -> tuple[list[RawChunk], int]:
    """
    Full pipeline: extract → chunk.
    Returns (chunks, total_page_count).
    """
    pages = extract_text_by_page(file_path)
    total_pages = len(pages)
    chunks = chunk_pages(pages)
    return chunks, total_pages
