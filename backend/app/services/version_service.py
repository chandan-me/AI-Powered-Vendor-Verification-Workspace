from datetime import datetime, timezone
from typing import Dict, Any, Tuple, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.vendor import Vendor, VendorVersion

TRACKED_VENDOR_FIELDS = [
    "company_name",
    "contact_person",
    "email",
    "phone",
    "address",
    "registration_number",
    "gst_number",
    "bank_account_number",
    "ifsc_code"
]

class VersionService:
    @staticmethod
    def get_snapshot(vendor: Vendor) -> Dict[str, Any]:
        """Creates a dictionary snapshot of tracked vendor fields."""
        return {field: getattr(vendor, field) for field in TRACKED_VENDOR_FIELDS}

    @classmethod
    def record_version(
        cls,
        db: Session,
        vendor: Vendor,
        actor: str = "Reviewer",
        reason: Optional[str] = None
    ) -> VendorVersion:
        """Captures the current state as a new version entry."""
        # Find highest version number
        last_version = db.query(VendorVersion).filter(
            VendorVersion.vendor_id == vendor.id
        ).order_by(VendorVersion.version_number.desc()).first()

        next_version_num = (last_version.version_number + 1) if last_version else 1
        current_snapshot = cls.get_snapshot(vendor)

        diff: Dict[str, Any] = {}
        if last_version and last_version.snapshot:
            old_snap = last_version.snapshot
            for f in TRACKED_VENDOR_FIELDS:
                old_val = old_snap.get(f)
                new_val = current_snapshot.get(f)
                if old_val != new_val:
                    diff[f] = {"old": old_val, "new": new_val}

        version_entry = VendorVersion(
            vendor_id=vendor.id,
            version_number=next_version_num,
            snapshot=current_snapshot,
            changed_fields=diff if diff else None,
            actor=actor,
            reason=reason or (f"Initial profile creation" if next_version_num == 1 else "Profile fields updated")
        )
        db.add(version_entry)
        db.commit()
        db.refresh(version_entry)
        return version_entry

    @classmethod
    def restore_version(
        cls,
        db: Session,
        vendor_id: int,
        version_id: int,
        reason: Optional[str] = None,
        actor: str = "Reviewer"
    ) -> Tuple[Vendor, VendorVersion]:
        """Restores fields from a historical version and records a new version entry for the restoration."""
        vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")

        target_version = db.query(VendorVersion).filter(
            VendorVersion.id == version_id,
            VendorVersion.vendor_id == vendor_id
        ).first()
        if not target_version:
            raise HTTPException(status_code=404, detail="Specified version record not found")

        old_snapshot = cls.get_snapshot(vendor)
        restore_data = target_version.snapshot

        diff: Dict[str, Any] = {}
        for f in TRACKED_VENDOR_FIELDS:
            if f in restore_data:
                current_val = getattr(vendor, f)
                new_val = restore_data[f]
                if current_val != new_val:
                    diff[f] = {"old": current_val, "new": new_val}
                    setattr(vendor, f, new_val)

        # Record a brand new version entry for the restoration
        last_version = db.query(VendorVersion).filter(
            VendorVersion.vendor_id == vendor.id
        ).order_by(VendorVersion.version_number.desc()).first()
        next_ver = (last_version.version_number + 1) if last_version else 1

        new_snapshot = cls.get_snapshot(vendor)
        reason_text = f"Restored from Version {target_version.version_number}"
        if reason:
            reason_text += f" - {reason}"

        restore_entry = VendorVersion(
            vendor_id=vendor.id,
            version_number=next_ver,
            snapshot=new_snapshot,
            changed_fields=diff,
            actor=actor,
            reason=reason_text
        )
        db.add(restore_entry)
        db.commit()
        db.refresh(vendor)
        db.refresh(restore_entry)
        return vendor, restore_entry
