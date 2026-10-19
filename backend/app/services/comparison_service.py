import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.vendor import Vendor
from app.models.document import Document
from app.models.verification import FieldComparison, CompanyVerification

COMPARISON_FIELDS = [
    "company_name",
    "registration_number",
    "gst_number",
    "address",
    "bank_account_number",
    "ifsc_code"
]

class ComparisonService:
    @classmethod
    def run_comparison(cls, db: Session, vendor: Vendor) -> List[FieldComparison]:
        """Runs multi-source deterministic comparison and updates field_comparisons records."""
        # 1. Gather all documents
        docs = db.query(Document).filter(Document.vendor_id == vendor.id).all()
        
        extracted_by_type: Dict[str, Dict[str, Any]] = {
            "REGISTRATION_CERTIFICATE": {},
            "GST_CERTIFICATE": {},
            "BANK_DOCUMENT": {}
        }
        
        for doc in docs:
            if doc.extraction:
                # Merge base extracted json with any user corrections
                base_data = doc.extraction.extracted_json or {}
                user_edits = doc.extraction.user_edited_json or {}
                
                merged_fields: Dict[str, str] = {}
                for field in COMPARISON_FIELDS:
                    if field in user_edits and user_edits[field]:
                        merged_fields[field] = str(user_edits[field]).strip()
                    elif field in base_data and isinstance(base_data[field], dict):
                        val = base_data[field].get("value")
                        if val is not None:
                            merged_fields[field] = str(val).strip()

                doc_type_upper = doc.document_type.upper()
                if doc_type_upper in extracted_by_type:
                    extracted_by_type[doc_type_upper] = merged_fields

        # 2. Gather latest external verification
        ext_verif = db.query(CompanyVerification).filter(
            CompanyVerification.vendor_id == vendor.id
        ).order_by(CompanyVerification.verified_at.desc()).first()

        comparisons_result: List[FieldComparison] = []

        # 3. For each field, compare sources
        for field in COMPARISON_FIELDS:
            vendor_val = getattr(vendor, field, None)
            reg_val = extracted_by_type["REGISTRATION_CERTIFICATE"].get(field)
            gst_val = extracted_by_type["GST_CERTIFICATE"].get(field)
            bank_val = extracted_by_type["BANK_DOCUMENT"].get(field)
            ext_val = None
            if ext_verif:
                if field == "company_name":
                    ext_val = ext_verif.extracted_company_name
                elif field == "registration_number":
                    ext_val = ext_verif.extracted_reg_number

            status, explanation = cls._evaluate_field_sources(
                field=field,
                vendor_val=vendor_val,
                reg_val=reg_val,
                gst_val=gst_val,
                bank_val=bank_val,
                ext_val=ext_val
            )

            # Find or create record
            fc = db.query(FieldComparison).filter(
                FieldComparison.vendor_id == vendor.id,
                FieldComparison.field_name == field
            ).first()

            if not fc:
                fc = FieldComparison(
                    vendor_id=vendor.id,
                    field_name=field,
                    vendor_value=vendor_val,
                    registration_value=reg_val,
                    gst_value=gst_val,
                    bank_value=bank_val,
                    external_api_value=ext_val,
                    match_status=status,
                    explanation=explanation,
                    review_status="PENDING"
                )
                db.add(fc)
            else:
                fc.vendor_value = vendor_val
                fc.registration_value = reg_val
                fc.gst_value = gst_val
                fc.bank_value = bank_val
                fc.external_api_value = ext_val
                fc.match_status = status
                fc.explanation = explanation

            comparisons_result.append(fc)

        db.commit()

        # Check for unresolved mismatches and create compliance tasks (PDF Page 3 requirement)
        from app.models.workflow import Task
        unresolved_mismatches = [c for c in comparisons_result if c.match_status == "MISMATCH" and c.review_status != "RESOLVED"]
        if unresolved_mismatches:
            for m in unresolved_mismatches:
                field_title = m.field_name.replace('_', ' ').title()
                task_title = f"Resolve Discrepancy: {field_title} Mismatch"
                existing_task = db.query(Task).filter(
                    Task.vendor_id == vendor.id,
                    Task.title == task_title,
                    Task.status == "PENDING"
                ).first()
                if not existing_task:
                    new_task = Task(
                        vendor_id=vendor.id,
                        title=task_title,
                        description=f"Automated comparison identified cross-source conflict in '{field_title}'. Details: {m.explanation}",
                        priority="HIGH",
                        status="PENDING"
                    )
                    db.add(new_task)

            # If vendor was Under Review, flag Action Required
            if vendor.status == "UNDER_REVIEW":
                vendor.status = "ACTION_REQUIRED"
                from app.models.workflow import WorkflowHistory
                db.add(WorkflowHistory(
                    vendor_id=vendor.id,
                    previous_status="UNDER_REVIEW",
                    new_status="ACTION_REQUIRED",
                    reason=f"Action required due to {len(unresolved_mismatches)} detected field discrepancy(ies)",
                    actor="Comparison Engine"
                ))

            db.commit()

        for fc in comparisons_result:
            db.refresh(fc)
        return comparisons_result

    @classmethod
    def resolve_discrepancy(
        cls,
        db: Session,
        comparison_id: int,
        resolution_notes: str,
        actor: str = "Reviewer"
    ) -> FieldComparison:
        """Allows reviewer to formally resolve a detected mismatch with justification notes."""
        fc = db.query(FieldComparison).filter(FieldComparison.id == comparison_id).first()
        if not fc:
            raise ValueError("Field comparison record not found")

        fc.review_status = "RESOLVED"
        fc.explanation = f"[RESOLVED by {actor}]: {resolution_notes}. Original issue: {fc.explanation}"
        db.commit()

        # Complete associated task if exists
        from app.models.workflow import Task
        from datetime import datetime, timezone
        field_title = fc.field_name.replace('_', ' ').title()
        task_title = f"Resolve Discrepancy: {field_title} Mismatch"
        task = db.query(Task).filter(
            Task.vendor_id == fc.vendor_id,
            Task.title == task_title,
            Task.status == "PENDING"
        ).first()
        if task:
            task.status = "COMPLETED"
            task.completed_at = datetime.now(timezone.utc)
            db.commit()

        db.refresh(fc)
        return fc

    @classmethod
    def _evaluate_field_sources(
        cls,
        field: str,
        vendor_val: Optional[str],
        reg_val: Optional[str],
        gst_val: Optional[str],
        bank_val: Optional[str],
        ext_val: Optional[str]
    ) -> tuple[str, str]:
        # Collect non-null, non-empty sources
        present_sources: Dict[str, str] = {}
        if vendor_val and str(vendor_val).strip():
            present_sources["Vendor Profile"] = str(vendor_val).strip()
        if reg_val and str(reg_val).strip():
            present_sources["Registration Doc"] = str(reg_val).strip()
        if gst_val and str(gst_val).strip():
            present_sources["GST Doc"] = str(gst_val).strip()
        if bank_val and str(bank_val).strip():
            present_sources["Bank Doc"] = str(bank_val).strip()
        if ext_val and str(ext_val).strip():
            present_sources["Registry API"] = str(ext_val).strip()

        # If only vendor profile is present and no documents or APIs have this field
        if len(present_sources) <= 1:
            if "Vendor Profile" in present_sources:
                return "MISSING", f"Only vendor profile provided. No uploaded document or external verification currently provides '{field}'."
            else:
                return "MISSING", f"No data provided for '{field}' from any source."

        # Normalize and compare
        norm_map: Dict[str, str] = {}
        for src_name, val in present_sources.items():
            norm_map[src_name] = cls._normalize_value(field, val)

        # Compare values against the primary canonical source (Vendor Profile or Registration)
        unique_norms = set(norm_map.values())
        if len(unique_norms) == 1:
            sources_list = ", ".join(present_sources.keys())
            return "MATCH", f"Consistent across all available sources ({sources_list})."
        else:
            # Describe the specific mismatch
            mismatches = []
            for src, raw_val in present_sources.items():
                mismatches.append(f"{src}: '{raw_val}'")
            return "MISMATCH", f"Discrepancy detected across sources -> {'; '.join(mismatches)}."

    @staticmethod
    def _normalize_value(field: str, val: str) -> str:
        s = val.strip().lower()
        if field == "company_name":
            # Normalize common business suffixes
            s = re.sub(r'\b(pvt\.?\s*ltd\.?|private\s*limited)\b', 'pvt ltd', s)
            s = re.sub(r'\b(ltd\.?|limited)\b', 'ltd', s)
            s = re.sub(r'\b(inc\.?|incorporated)\b', 'inc', s)
            s = re.sub(r'\b(corp\.?|corporation)\b', 'corp', s)
            s = re.sub(r'[^a-z0-9]', '', s)
            return s
        elif field in ("registration_number", "gst_number", "ifsc_code"):
            # Identifiers: alphanumeric only, uppercase
            return re.sub(r'[^a-z0-9]', '', s)
        elif field == "bank_account_number":
            # Compare numeric digits, removing spaces and leading zeros
            digits = re.sub(r'[^0-9]', '', s)
            return digits.lstrip('0')
        elif field == "address":
            # Strip punctuation and collapse whitespace
            s = re.sub(r'[^a-z0-9]', ' ', s)
            s = re.sub(r'\s+', ' ', s).strip()
            return s
        return s
