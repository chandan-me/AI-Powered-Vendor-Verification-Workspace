import os
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.document import Document, DocumentExtraction
from app.schemas.document import DocumentResponse, DocumentExtractionResponse, ExtractionCorrectionRequest
from app.services.document_service import DocumentService
from app.services.ai_extraction_service import AIExtractionService
from app.services.vendor_service import VendorService

router = APIRouter(tags=["Documents"])

@router.post("/vendors/{vendor_id}/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_vendor_document(
    vendor_id: int,
    document_type: str = Form(..., description="REGISTRATION_CERTIFICATE, GST_CERTIFICATE, BANK_DOCUMENT, OTHER"),
    file: UploadFile = File(...),
    auto_extract: bool = Form(True, description="Automatically trigger AI extraction upon upload"),
    db: Session = Depends(get_db)
):
    # Verify vendor exists
    VendorService.get_vendor(db, vendor_id)

    doc = DocumentService.save_and_create_document(
        db=db,
        vendor_id=vendor_id,
        file=file,
        document_type=document_type
    )

    if auto_extract:
        AIExtractionService.extract_document(db, doc)

    db.refresh(doc)
    return doc

@router.get("/vendors/{vendor_id}/documents", response_model=List[DocumentResponse])
def get_vendor_documents(vendor_id: int, db: Session = Depends(get_db)):
    VendorService.get_vendor(db, vendor_id)
    docs = db.query(Document).filter(Document.vendor_id == vendor_id).order_by(Document.uploaded_at.desc()).all()
    return docs

@router.get("/documents/{document_id}", response_model=DocumentResponse)
def get_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.get("/documents/{document_id}/download")
def download_document(
    document_id: int,
    inline: bool = False,
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    safe_path = DocumentService.get_document_path_safe(doc)
    return FileResponse(
        path=safe_path,
        filename=doc.original_filename,
        media_type=doc.mime_type,
        content_disposition_type="inline" if inline else "attachment"
    )

@router.post("/documents/{document_id}/extract", response_model=DocumentExtractionResponse)
def extract_document_information(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    extraction = AIExtractionService.extract_document(db, doc)
    return extraction

@router.put("/documents/{document_id}/extraction", response_model=DocumentExtractionResponse)
def update_extraction_corrections(
    document_id: int,
    corrections: ExtractionCorrectionRequest,
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or not doc.extraction:
        raise HTTPException(status_code=404, detail="Extraction record not found for this document")

    corr_dict = corrections.model_dump(exclude_unset=True)
    updated_extraction = AIExtractionService.update_corrections(db, doc.extraction.id, corr_dict)
    return updated_extraction

@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Remove file from disk
    try:
        safe_path = DocumentService.get_document_path_safe(doc)
        if os.path.exists(safe_path):
            os.remove(safe_path)
    except Exception:
        pass

    db.delete(doc)
    db.commit()
    return None
