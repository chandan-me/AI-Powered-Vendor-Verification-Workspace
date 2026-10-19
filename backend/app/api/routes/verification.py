from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.verification import (
    FieldComparisonResponse,
    CompanyVerificationRequest,
    CompanyVerificationResponse,
    ComparisonSummaryResponse,
    ResolveDiscrepancyRequest
)
from app.services.vendor_service import VendorService
from app.services.comparison_service import ComparisonService
from app.services.company_verification_service import CompanyVerificationService
from app.models.verification import FieldComparison, CompanyVerification

router = APIRouter(prefix="/vendors/{vendor_id}", tags=["Verification & Comparison"])

@router.post("/compare", response_model=ComparisonSummaryResponse)
def trigger_field_comparison(vendor_id: int, db: Session = Depends(get_db)):
    vendor = VendorService.get_vendor(db, vendor_id)
    comparisons = ComparisonService.run_comparison(db, vendor)
    
    mismatch_count = sum(1 for c in comparisons if c.match_status == "MISMATCH")
    match_count = sum(1 for c in comparisons if c.match_status == "MATCH")
    missing_count = sum(1 for c in comparisons if c.match_status == "MISSING")

    return ComparisonSummaryResponse(
        comparisons=comparisons,
        has_mismatches=(mismatch_count > 0),
        mismatch_count=mismatch_count,
        match_count=match_count,
        missing_count=missing_count
    )

@router.get("/comparisons", response_model=List[FieldComparisonResponse])
def get_field_comparisons(vendor_id: int, db: Session = Depends(get_db)):
    VendorService.get_vendor(db, vendor_id)
    comparisons = db.query(FieldComparison).filter(FieldComparison.vendor_id == vendor_id).all()
    return comparisons

@router.patch("/comparisons/{comparison_id}/resolve", response_model=FieldComparisonResponse)
def resolve_comparison_discrepancy(
    vendor_id: int,
    comparison_id: int,
    req: ResolveDiscrepancyRequest,
    db: Session = Depends(get_db)
):
    VendorService.get_vendor(db, vendor_id)
    try:
        resolved = ComparisonService.resolve_discrepancy(
            db=db,
            comparison_id=comparison_id,
            resolution_notes=req.resolution_notes,
            actor=req.actor or "Reviewer"
        )
        return resolved
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/verify-company", response_model=CompanyVerificationResponse)
def verify_company_registry(
    vendor_id: int,
    req: CompanyVerificationRequest = CompanyVerificationRequest(),
    db: Session = Depends(get_db)
):
    vendor = VendorService.get_vendor(db, vendor_id)
    verif = CompanyVerificationService.verify_company(
        db=db,
        vendor=vendor,
        search_query=req.query,
        jurisdiction_code=req.jurisdiction_code
    )
    
    # Re-run comparison to incorporate newly verified external registry data
    ComparisonService.run_comparison(db, vendor)

    return verif

@router.get("/verification", response_model=Optional[CompanyVerificationResponse])
def get_latest_company_verification(vendor_id: int, db: Session = Depends(get_db)):
    VendorService.get_vendor(db, vendor_id)
    verif = db.query(CompanyVerification).filter(
        CompanyVerification.vendor_id == vendor_id
    ).order_by(CompanyVerification.verified_at.desc()).first()
    return verif
