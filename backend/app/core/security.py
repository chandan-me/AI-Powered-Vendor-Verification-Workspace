import os
import re
import uuid
from pathlib import Path
from fastapi import HTTPException, UploadFile, status

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
}

def mask_bank_account(account_number: str | None, visible_digits: int = 4) -> str:
    """Masks a bank account number showing only the last N digits (e.g. *******1234)."""
    if not account_number:
        return ""
    clean = str(account_number).strip()
    if len(clean) <= visible_digits:
        return clean
    return "*" * (len(clean) - visible_digits) + clean[-visible_digits:]

def sanitize_filename(filename: str) -> str:
    """Removes path traversal components and unsafe characters."""
    base = os.path.basename(filename)
    clean = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', base)
    return clean

def generate_secure_stored_filename(original_filename: str) -> str:
    """Generates an unpredictable unique filename with original extension."""
    ext = Path(original_filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".pdf"
    unique_id = uuid.uuid4().hex
    return f"doc_{unique_id}{ext}"

def validate_uploaded_file(file: UploadFile, max_size_mb: int = 10) -> None:
    """Validates file extension and mime type."""
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported MIME type '{file.content_type}'."
        )
