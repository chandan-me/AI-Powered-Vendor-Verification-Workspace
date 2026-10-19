from typing import List, Optional, Tuple
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.vendor import Vendor
from app.models.workflow import WorkflowHistory
from app.schemas.vendor import VendorCreate, VendorUpdate
from app.services.version_service import VersionService
from app.services.workflow_service import WorkflowService

class VendorService:
    @classmethod
    def create_vendor(cls, db: Session, vendor_in: VendorCreate) -> Vendor:
        vendor = Vendor(
            company_name=vendor_in.company_name.strip(),
            contact_person=vendor_in.contact_person.strip(),
            email=vendor_in.email.strip().lower(),
            phone=vendor_in.phone.strip(),
            address=vendor_in.address.strip(),
            registration_number=vendor_in.registration_number.strip().upper(),
            gst_number=vendor_in.gst_number.strip().upper(),
            bank_account_number=vendor_in.bank_account_number.strip(),
            ifsc_code=vendor_in.ifsc_code.strip().upper(),
            status="DRAFT"
        )
        db.add(vendor)
        db.commit()
        db.refresh(vendor)

        # 1. Initialize Document Checklist
        WorkflowService.initialize_checklist(db, vendor.id)

        # 2. Record Initial Workflow History
        history = WorkflowHistory(
            vendor_id=vendor.id,
            previous_status="NEW",
            new_status="DRAFT",
            reason="Initial vendor profile registration",
            actor="Registration Form"
        )
        db.add(history)
        db.commit()

        # 3. Capture Initial Version
        VersionService.record_version(
            db=db,
            vendor=vendor,
            actor="Initial Registration",
            reason="Created vendor record"
        )

        return vendor

    @classmethod
    def update_vendor(cls, db: Session, vendor_id: int, vendor_in: VendorUpdate, actor: str = "Reviewer") -> Vendor:
        vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")

        update_data = vendor_in.model_dump(exclude_unset=True)
        change_reason = update_data.pop("change_reason", "Vendor profile updated")

        has_changes = False
        for field, new_val in update_data.items():
            if hasattr(vendor, field):
                old_val = getattr(vendor, field)
                if str(old_val).strip() != str(new_val).strip():
                    setattr(vendor, field, new_val)
                    has_changes = True

        if has_changes:
            db.commit()
            db.refresh(vendor)
            # Record version with change diff
            VersionService.record_version(
                db=db,
                vendor=vendor,
                actor=actor,
                reason=change_reason
            )

        return vendor

    @classmethod
    def get_vendor(cls, db: Session, vendor_id: int) -> Vendor:
        vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")
        return vendor

    @classmethod
    def list_vendors(
        cls,
        db: Session,
        search: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Vendor], int]:
        query = db.query(Vendor)
        if status:
            query = query.filter(Vendor.status == status.upper())
        if search:
            search_clean = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Vendor.company_name.ilike(search_clean),
                    Vendor.registration_number.ilike(search_clean),
                    Vendor.gst_number.ilike(search_clean),
                    Vendor.email.ilike(search_clean),
                    Vendor.contact_person.ilike(search_clean)
                )
            )
        total = query.count()
        vendors = query.order_by(Vendor.updated_at.desc()).offset(skip).limit(limit).all()
        return vendors, total

    @classmethod
    def delete_vendor(cls, db: Session, vendor_id: int) -> bool:
        vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")
        db.delete(vendor)
        db.commit()
        return True
