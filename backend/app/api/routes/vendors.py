from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.vendor import VendorCreate, VendorUpdate, VendorResponse
from app.services.vendor_service import VendorService
from app.core.security import mask_bank_account

router = APIRouter(prefix="/vendors", tags=["Vendors"])

def serialize_vendor(vendor, unmask: bool = False) -> VendorResponse:
    return VendorResponse(
        id=vendor.id,
        company_name=vendor.company_name,
        contact_person=vendor.contact_person,
        email=vendor.email,
        phone=vendor.phone,
        address=vendor.address,
        registration_number=vendor.registration_number,
        gst_number=vendor.gst_number,
        bank_account_number_masked=mask_bank_account(vendor.bank_account_number),
        bank_account_number=vendor.bank_account_number if unmask else None,
        ifsc_code=vendor.ifsc_code,
        status=vendor.status,
        created_at=vendor.created_at,
        updated_at=vendor.updated_at
    )

@router.post("", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
def create_vendor(vendor_in: VendorCreate, db: Session = Depends(get_db)):
    vendor = VendorService.create_vendor(db, vendor_in)
    return serialize_vendor(vendor)

@router.get("", response_model=dict)
def list_vendors(
    search: Optional[str] = Query(None, description="Search by name, reg, gst, or email"),
    status: Optional[str] = Query(None, description="Filter by status: DRAFT, UNDER_REVIEW, etc."),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    vendors, total = VendorService.list_vendors(db, search=search, status=status, skip=skip, limit=limit)
    items = [serialize_vendor(v) for v in vendors]
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/{vendor_id}", response_model=VendorResponse)
def get_vendor(
    vendor_id: int,
    unmask: bool = Query(False, description="Authorize disclosure of bank account number"),
    db: Session = Depends(get_db)
):
    vendor = VendorService.get_vendor(db, vendor_id)
    return serialize_vendor(vendor, unmask=unmask)

@router.put("/{vendor_id}", response_model=VendorResponse)
def update_vendor(
    vendor_id: int,
    vendor_in: VendorUpdate,
    db: Session = Depends(get_db)
):
    vendor = VendorService.update_vendor(db, vendor_id, vendor_in)
    return serialize_vendor(vendor)

@router.delete("/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vendor(vendor_id: int, db: Session = Depends(get_db)):
    VendorService.delete_vendor(db, vendor_id)
    return None

@router.get("/{vendor_id}/dossier-pdf")
def download_vendor_compliance_dossier(vendor_id: int, db: Session = Depends(get_db)):
    from fastapi.responses import FileResponse
    from app.services.dossier_pdf_service import DossierPdfService
    
    vendor = VendorService.get_vendor(db, vendor_id)
    pdf_path = DossierPdfService.generate_vendor_dossier_pdf(db, vendor)
    clean_name = "".join(c for c in vendor.company_name if c.isalnum() or c in (' ', '_', '-')).strip().replace(' ', '_')
    filename = f"{clean_name}_Compliance_Dossier.pdf"
    
    return FileResponse(
        path=pdf_path,
        filename=filename,
        media_type="application/pdf"
    )

