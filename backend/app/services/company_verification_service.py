import httpx
import re
from typing import Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.logging import logger
from app.models.vendor import Vendor
from app.models.verification import CompanyVerification

class CompanyVerificationService:
    @classmethod
    def verify_company(
        cls,
        db: Session,
        vendor: Vendor,
        search_query: Optional[str] = None,
        jurisdiction_code: Optional[str] = None
    ) -> CompanyVerification:
        query = (search_query or vendor.registration_number or vendor.company_name).strip()
        
        # Determine whether to use real OpenCorporates or labeled demo simulation
        if settings.is_opencorporates_configured:
            result = cls._call_opencorporates(query, jurisdiction_code, vendor)
        else:
            result = cls._simulate_company_registry(query, jurisdiction_code, vendor)

        # Save record
        verification = CompanyVerification(
            vendor_id=vendor.id,
            provider="opencorporates",
            search_query=query,
            jurisdiction_code=jurisdiction_code,
            api_status_code=result.get("api_status_code"),
            raw_response=result.get("raw_response"),
            extracted_company_name=result.get("company_name"),
            extracted_reg_number=result.get("reg_number"),
            extracted_jurisdiction=result.get("jurisdiction"),
            extracted_status=result.get("status"),
            outcome=result.get("outcome", "UNABLE_TO_VERIFY"),
            mismatch_notes=result.get("notes"),
            is_simulated=result.get("is_simulated", False)
        )
        db.add(verification)

        # If outcome is MISMATCH, auto-create reviewer task (PDF Page 3 requirement)
        if result.get("outcome") == "MISMATCH":
            from app.models.workflow import Task
            task_title = f"Resolve Registry Mismatch: Corporate Registry Discrepancy"
            existing = db.query(Task).filter(
                Task.vendor_id == vendor.id,
                Task.title == task_title,
                Task.status == "PENDING"
            ).first()
            if not existing:
                db.add(Task(
                    vendor_id=vendor.id,
                    title=task_title,
                    description=f"Official registry verification failed to confirm vendor entity. Notes: {result.get('notes')}",
                    priority="HIGH",
                    status="PENDING"
                ))
            if vendor.status == "UNDER_REVIEW":
                vendor.status = "ACTION_REQUIRED"
                from app.models.workflow import WorkflowHistory
                db.add(WorkflowHistory(
                    vendor_id=vendor.id,
                    previous_status="UNDER_REVIEW",
                    new_status="ACTION_REQUIRED",
                    reason=f"Action required: Corporate registry mismatch detected",
                    actor="Registry Verification Engine"
                ))

        db.commit()
        db.refresh(verification)
        return verification

    @classmethod
    def _call_opencorporates(
        cls,
        query: str,
        jurisdiction_code: Optional[str],
        vendor: Vendor
    ) -> Dict[str, Any]:
        """Calls official OpenCorporates API with timeouts, retry, and error safety."""
        headers = {
            "Accept": "application/json",
            "User-Agent": "VendorVerify-AI/1.0"
        }
        params: Dict[str, Any] = {"q": query}
        if jurisdiction_code:
            params["jurisdiction_code"] = jurisdiction_code
        if settings.OPENCORPORATES_API_TOKEN:
            params["api_token"] = settings.OPENCORPORATES_API_TOKEN

        url = "https://api.opencorporates.com/v0.4/companies/search"

        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.get(url, params=params, headers=headers)
                status_code = resp.status_code

                if status_code in (401, 403):
                    logger.warning("OpenCorporates authentication or token limit reached.")
                    return {
                        "api_status_code": status_code,
                        "raw_response": resp.json() if resp.is_success else {"error": resp.text},
                        "outcome": "UNABLE_TO_VERIFY",
                        "notes": "External API authentication failed or request quota reached. This does not indicate vendor invalidity.",
                        "is_simulated": False
                    }
                elif status_code == 429:
                    logger.warning("OpenCorporates rate limit encountered.")
                    return {
                        "api_status_code": status_code,
                        "raw_response": {"error": "Rate limit exceeded"},
                        "outcome": "UNABLE_TO_VERIFY",
                        "notes": "External Registry rate limit exceeded. Please retry later.",
                        "is_simulated": False
                    }
                elif not resp.is_success:
                    logger.warning(f"OpenCorporates returned error HTTP {status_code}")
                    return {
                        "api_status_code": status_code,
                        "raw_response": {"error": resp.text[:500]},
                        "outcome": "UNABLE_TO_VERIFY",
                        "notes": f"External registry service returned status {status_code}.",
                        "is_simulated": False
                    }

                data = resp.json()
                results = data.get("results", {}).get("companies", [])
                if not results:
                    return {
                        "api_status_code": status_code,
                        "raw_response": data,
                        "outcome": "UNABLE_TO_VERIFY",
                        "notes": "No matching active corporate entity found in the queried registry.",
                        "is_simulated": False
                    }

                # Evaluate best match
                top_company = results[0].get("company", {})
                company_name = top_company.get("name", "")
                reg_num = top_company.get("company_number", "")
                jurisdiction = top_company.get("jurisdiction_code", "")
                company_status = top_company.get("current_status", "")

                outcome, notes = cls._evaluate_match(vendor, company_name, reg_num, company_status)
                return {
                    "api_status_code": status_code,
                    "raw_response": data,
                    "company_name": company_name,
                    "reg_number": reg_num,
                    "jurisdiction": jurisdiction,
                    "status": company_status,
                    "outcome": outcome,
                    "notes": notes,
                    "is_simulated": False
                }

        except httpx.TimeoutException:
            logger.error("OpenCorporates API timed out.")
            return {
                "api_status_code": 408,
                "raw_response": {"error": "Timeout connecting to OpenCorporates"},
                "outcome": "UNABLE_TO_VERIFY",
                "notes": "Registry lookup timed out. External API failure does not imply vendor invalidity.",
                "is_simulated": False
            }
        except Exception as e:
            logger.error(f"Unexpected error in OpenCorporates verification: {e}")
            return {
                "api_status_code": 500,
                "raw_response": {"error": str(e)},
                "outcome": "UNABLE_TO_VERIFY",
                "notes": f"Network or adapter error while querying external registry: {e}",
                "is_simulated": False
            }

    @classmethod
    def _simulate_company_registry(
        cls,
        query: str,
        jurisdiction_code: Optional[str],
        vendor: Vendor
    ) -> Dict[str, Any]:
        """Provides a clearly labeled realistic demo simulation for evaluation."""
        q_clean = query.lower().strip()
        reg_clean = re.sub(r'[^A-Za-z0-9]', '', vendor.registration_number).lower()

        # Check if query matches vendor company name or registration number
        vendor_name_clean = re.sub(r'[^A-Za-z0-9]', '', vendor.company_name).lower()
        search_clean = re.sub(r'[^A-Za-z0-9]', '', query).lower()

        # Known simulated edge cases for testing scenarios:
        if "invalid" in q_clean or "fake" in q_clean or "notfound" in q_clean:
            return {
                "api_status_code": 200,
                "raw_response": {"results": {"companies": [], "total_count": 0}},
                "outcome": "UNABLE_TO_VERIFY",
                "notes": "[DEMO MODE: Simulated External Verification] No registered corporate entities match this query.",
                "is_simulated": True
            }
        
        if "timeout" in q_clean:
            return {
                "api_status_code": 408,
                "raw_response": {"error": "Simulated external API timeout"},
                "outcome": "UNABLE_TO_VERIFY",
                "notes": "[DEMO MODE: Simulated External Verification] Request timed out. API failure is not treated as vendor invalidity.",
                "is_simulated": True
            }

        if "mismatch" in q_clean:
            return {
                "api_status_code": 200,
                "raw_response": {
                    "results": {
                        "companies": [{
                            "company": {
                                "name": "Completely Different Legal Entity Ltd",
                                "company_number": "DIFF99887766",
                                "jurisdiction_code": jurisdiction_code or "in",
                                "current_status": "Active"
                            }
                        }]
                    }
                },
                "company_name": "Completely Different Legal Entity Ltd",
                "reg_number": "DIFF99887766",
                "jurisdiction": jurisdiction_code or "in",
                "status": "Active",
                "outcome": "MISMATCH",
                "notes": "[DEMO MODE: Simulated External Verification] Official registered entity name and registration number differ substantially from vendor input.",
                "is_simulated": True
            }

        # Default realistic match based on vendor's company
        is_name_match = (vendor_name_clean in search_clean) or (search_clean in vendor_name_clean) or (reg_clean in search_clean) or (search_clean in reg_clean)
        
        simulated_name = vendor.company_name
        simulated_reg = vendor.registration_number
        simulated_status = "Active"

        outcome, notes = cls._evaluate_match(vendor, simulated_name, simulated_reg, simulated_status)
        
        return {
            "api_status_code": 200,
            "raw_response": {
                "results": {
                    "companies": [{
                        "company": {
                            "name": simulated_name,
                            "company_number": simulated_reg,
                            "jurisdiction_code": jurisdiction_code or "in",
                            "current_status": simulated_status,
                            "incorporation_date": "2021-03-15",
                            "registered_address_in_full": vendor.address
                        }
                    }],
                    "total_count": 1
                }
            },
            "company_name": simulated_name,
            "reg_number": simulated_reg,
            "jurisdiction": jurisdiction_code or "in",
            "status": simulated_status,
            "outcome": outcome,
            "notes": f"[DEMO MODE: Simulated External Verification] {notes}",
            "is_simulated": True
        }

    @staticmethod
    def _evaluate_match(
        vendor: Vendor,
        found_name: str,
        found_reg: str,
        status: str
    ) -> Tuple[str, str]:
        def norm(s: str) -> str:
            return re.sub(r'[^A-Za-z0-9]', '', s or "").lower()

        v_name_norm = norm(vendor.company_name)
        f_name_norm = norm(found_name)
        v_reg_norm = norm(vendor.registration_number)
        f_reg_norm = norm(found_reg)

        name_match = (v_name_norm == f_name_norm) or (v_name_norm in f_name_norm) or (f_name_norm in v_name_norm)
        reg_match = (v_reg_norm == f_reg_norm) if (v_reg_norm and f_reg_norm) else False

        if status and status.lower() in ["dissolved", "struck off", "inactive", "liquidation"]:
            return "MISMATCH", f"Entity is marked as '{status}' in the official corporate registry."

        if reg_match or (name_match and (not v_reg_norm or not f_reg_norm)):
            return "VERIFIED", f"Company details confirmed with official corporate registry records ({found_name}, #{found_reg})."
        elif name_match and not reg_match:
            return "MISMATCH", f"Company name matched but registration number differs (Registry: #{found_reg} vs Vendor: #{vendor.registration_number})."
        else:
            return "MISMATCH", f"Official registry record ({found_name}, #{found_reg}) does not match vendor profile ({vendor.company_name}, #{vendor.registration_number})."
