"""
File Service — Extract text from PDF, DOCX, TXT uploads
"""
import io
import logging
from fastapi import UploadFile, HTTPException
from backend.config import settings

logger = logging.getLogger(__name__)

MAX_SIZE = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024  # Convert to bytes

ALLOWED_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/plain": "txt",
}


async def extract_text_from_file(file: UploadFile) -> str:
    """Extract raw text from an uploaded PDF, DOCX, or TXT file."""
    content_type = file.content_type
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload PDF, DOCX, or TXT."
        )

    data = await file.read()
    if len(data) > MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    file_type = ALLOWED_TYPES[content_type]
    try:
        if file_type == "pdf":
            return _extract_pdf(data)
        elif file_type == "docx":
            return _extract_docx(data)
        else:
            return data.decode("utf-8", errors="ignore")
    except Exception as e:
        logger.error(f"File extraction error: {e}")
        raise HTTPException(status_code=422, detail=f"Could not extract text: {str(e)}")


def _extract_pdf(data: bytes) -> str:
    """Extract text from PDF bytes using PyPDF2."""
    import PyPDF2
    reader = PyPDF2.PdfReader(io.BytesIO(data))
    pages = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text.strip())
    extracted = "\n\n".join(pages)
    if not extracted.strip():
        raise ValueError("Could not extract text from PDF. The file may be scanned or image-based.")
    return extracted


def _extract_docx(data: bytes) -> str:
    """Extract text from DOCX bytes using python-docx."""
    from docx import Document
    doc = Document(io.BytesIO(data))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    extracted = "\n\n".join(paragraphs)
    if not extracted.strip():
        raise ValueError("Could not extract text from DOCX file.")
    return extracted
