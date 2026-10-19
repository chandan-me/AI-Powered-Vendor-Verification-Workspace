from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.vendor import VendorVersion
from app.schemas.vendor import VendorVersionResponse, VersionRestoreRequest, VendorResponse
from app.services.vendor_service import VendorService
from app.services.version_service import VersionService
from app.api.routes.vendors import serialize_vendor

router = APIRouter(prefix="/vendors/{vendor_id}/versions", tags=["Version History"])

@router.get("", response_model=List[VendorVersionResponse])
def get_vendor_versions(vendor_id: int, db: Session = Depends(get_db)):
    VendorService.get_vendor(db, vendor_id)
    versions = db.query(VendorVersion).filter(
        VendorVersion.vendor_id == vendor_id
    ).order_by(VendorVersion.version_number.desc()).all()
    return versions

@router.post("/{version_id}/restore", response_model=VendorResponse)
def restore_vendor_version(
    vendor_id: int,
    version_id: int,
    req: VersionRestoreRequest = VersionRestoreRequest(),
    db: Session = Depends(get_db)
):
    vendor, _ = VersionService.restore_version(
        db=db,
        vendor_id=vendor_id,
        version_id=version_id,
        reason=req.reason
    )
    return serialize_vendor(vendor)
