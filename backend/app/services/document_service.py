import os
import shutil
from pathlib import Path
from typing import Optional
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
import pdfplumber

from app.core.config import settings
from app.core.security import validate_uploaded_file, generate_secure_stored_filename, sanitize_filename
from app.core.logging import logger
from app.models.document import Document
from app.models.workflow import DocumentChecklist

class DocumentService:
    @staticmethod
    def extract_text_from_file(file_path: str, mime_type: str) -> str:
        """Extracts text from PDF or text-based documents with fallback."""
        text_content = ""
        try:
            if "pdf" in mime_type.lower() or file_path.lower().endswith(".pdf"):
                with pdfplumber.open(file_path) as pdf:
                    pages_text = []
                    for i, page in enumerate(pdf.pages):
                        page_text = page.extract_text() or ""
                        pages_text.append(f"--- Page {i+1} ---\n{page_text}")
                    text_content = "\n\n".join(pages_text).strip()
            else:
                # Image file: if OCR is not locally installed, attempt basic fallback or notify
                text_content = f"[Image Document Uploaded: {os.path.basename(file_path)}]"
        except Exception as e:
            logger.warning(f"Error extracting text from {file_path}: {e}")
            text_content = ""
        return text_content

    @classmethod
    def save_and_create_document(
        cls,
        db: Session,
        vendor_id: int,
        file: UploadFile,
        document_type: str
    ) -> Document:
        validate_uploaded_file(file, max_size_mb=settings.MAX_UPLOAD_SIZE_MB)
        
        safe_orig_name = sanitize_filename(file.filename or "uploaded_document.pdf")
        stored_filename = generate_secure_stored_filename(safe_orig_name)
        stored_path = os.path.join(settings.UPLOAD_DIR, stored_filename)

        # Write uploaded file to private storage outside web root
        try:
            with open(stored_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            file_size = os.path.getsize(stored_path)
        except Exception as e:
            logger.error(f"Failed to store file {safe_orig_name}: {e}")
            raise HTTPException(status_code=500, detail="Failed to save uploaded file safely")

        # Create Document record
        doc = Document(
            vendor_id=vendor_id,
            document_type=document_type.upper(),
            filename=stored_filename,
            original_filename=safe_orig_name,
            file_path=stored_path,
            file_size=file_size,
            mime_type=file.content_type or "application/octet-stream",
            processing_status="PENDING",
            verification_status="UNVERIFIED"
        )
        db.add(doc)
        
        # Update checklist item if exists
        checklist_item = db.query(DocumentChecklist).filter(
            DocumentChecklist.vendor_id == vendor_id,
            DocumentChecklist.document_type == document_type.upper()
        ).first()
        if checklist_item:
            checklist_item.status = "AVAILABLE"
            checklist_item.notes = f"Document uploaded: {safe_orig_name}"
            
        db.commit()
        db.refresh(doc)
        return doc

    @staticmethod
    def get_document_path_safe(doc: Document) -> str:
        """Ensures path exists and prevents path traversal attacks."""
        resolved = Path(doc.file_path).resolve()
        
        from app.core.config import BASE_DIR
        project_root = BASE_DIR.parent.resolve()
        upload_base = Path(settings.UPLOAD_DIR).resolve()
        
        allowed_roots = [
            upload_base,
            BASE_DIR / "private_uploads",
            project_root / "private_uploads",
            project_root / "sample_documents",
            BASE_DIR / "sample_documents",
            BASE_DIR.parent / "sample_documents",
        ]
        
        # Check if resolved path is within any allowed root (case-insensitive for Windows)
        resolved_str = str(resolved).lower()
        is_allowed = any(
            resolved_str.startswith(str(root.resolve()).lower())
            for root in allowed_roots
        ) or resolved_str.startswith(str(project_root).lower())
        
        if not is_allowed:
            raise HTTPException(status_code=403, detail="Access denied: Invalid file path")
            
        # If the file does not exist at the exact stored path, check known locations
        if not resolved.exists():
            candidate_paths = [
                upload_base / doc.filename,
                BASE_DIR / "private_uploads" / doc.filename,
                project_root / "private_uploads" / doc.filename,
                project_root / "sample_documents" / doc.filename,
                project_root / "sample_documents" / doc.original_filename,
            ]
            for cand in candidate_paths:
                if cand.resolve().exists():
                    resolved = cand.resolve()
                    break
                    
        if not resolved.exists():
            raise HTTPException(status_code=404, detail="Physical document file not found")
            
        return str(resolved)
