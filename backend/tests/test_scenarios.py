import io
import pytest
from app.api.routes.samples import ensure_sample_pdfs

def test_scenario_a_successful_onboarding(client):
    """Scenario A: Successful vendor onboarding flow."""
    # 1. Create vendor
    vendor_payload = {
        "company_name": "Acme Global Solutions Pvt Ltd",
        "contact_person": "Alice Smith",
        "email": "alice@acmeglobal.com",
        "phone": "+91 91234 56789",
        "address": "Electronic City Phase 1, Bangalore, Karnataka 560100",
        "registration_number": "U72900KA2022PTC156789",
        "gst_number": "29AAACA1234A1Z1",
        "bank_account_number": "112233445566",
        "ifsc_code": "HDFC0004321"
    }
    create_res = client.post("/api/vendors", json=vendor_payload)
    assert create_res.status_code == 201
    vendor_data = create_res.json()
    vendor_id = vendor_data["id"]
    assert vendor_data["status"] == "DRAFT"
    assert "******" in vendor_data["bank_account_number_masked"]

    # 2. Upload sample registration document
    sample_files = ensure_sample_pdfs()
    with open(sample_files["registration"], "rb") as f:
        file_content = f.read()

    upload_res = client.post(
        f"/api/vendors/{vendor_id}/documents",
        data={"document_type": "REGISTRATION_CERTIFICATE", "auto_extract": "true"},
        files={"file": ("registration.pdf", file_content, "application/pdf")}
    )
    assert upload_res.status_code == 201
    doc_data = upload_res.json()
    assert doc_data["processing_status"] == "EXTRACTED"
    doc_id = doc_data["id"]

    # 3. Edit extracted fields
    corr_res = client.put(
        f"/api/documents/{doc_id}/extraction",
        json={"company_name": "Acme Global Solutions Pvt Ltd"}
    )
    assert corr_res.status_code == 200
    assert corr_res.json()["is_user_corrected"] is True

    # 4. Run external company verification
    verif_res = client.post(f"/api/vendors/{vendor_id}/verify-company", json={})
    assert verif_res.status_code == 200
    assert verif_res.json()["outcome"] in ["VERIFIED", "UNABLE_TO_VERIFY", "MISMATCH"]

    # 5. Run comparison
    comp_res = client.post(f"/api/vendors/{vendor_id}/compare")
    assert comp_res.status_code == 200
    summary = comp_res.json()
    assert len(summary["comparisons"]) == 6

    # 6. Update workflow to UNDER_REVIEW
    wf_res = client.patch(
        f"/api/vendors/{vendor_id}/workflow",
        json={"new_status": "UNDER_REVIEW", "reason": "Moving to formal review"}
    )
    assert wf_res.status_code == 200
    assert wf_res.json()["status"] == "UNDER_REVIEW"

def test_scenario_b_missing_document(client):
    """Scenario B: Missing document detection and email trigger."""
    vendor_payload = {
        "company_name": "Beta Incomplete Ltd",
        "contact_person": "Bob Jones",
        "email": "bob@betaltd.com",
        "phone": "+91 98888 77777",
        "address": "Indiranagar, Bangalore",
        "registration_number": "U12345KA2020PTC123456",
        "gst_number": "29BBBBB1234B1Z2",
        "bank_account_number": "998877665544",
        "ifsc_code": "ICIC0001234"
    }
    v_res = client.post("/api/vendors", json=vendor_payload)
    vendor_id = v_res.json()["id"]

    # Check checklist - all 3 should be missing initially
    chk_res = client.get(f"/api/vendors/{vendor_id}/checklist")
    assert chk_res.status_code == 200
    items = chk_res.json()
    assert len(items) == 3
    assert all(item["status"] == "MISSING" for item in items)

    # Trigger missing document check
    check_res = client.post(f"/api/vendors/{vendor_id}/check-missing", json={"force_resend": True})
    assert check_res.status_code == 200
    res_data = check_res.json()
    assert res_data["action_required_triggered"] is True
    assert len(res_data["missing_documents"]) == 3
    assert res_data["email_sent"] is True

    # Vendor status should now be ACTION_REQUIRED
    v_get = client.get(f"/api/vendors/{vendor_id}")
    assert v_get.json()["status"] == "ACTION_REQUIRED"

    # Tasks should contain a pending task for missing docs
    tasks_res = client.get(f"/api/tasks?vendor_id={vendor_id}")
    assert len(tasks_res.json()) >= 1
    assert "Missing Documents" in tasks_res.json()[0]["title"]

def test_scenario_c_mismatched_information(client):
    """Scenario C: Mismatched information detection and approval blocking."""
    vendor_payload = {
        "company_name": "Delta Softwares India Pvt Ltd",
        "contact_person": "David Miller",
        "email": "david@deltasoft.com",
        "phone": "+91 97777 66666",
        "address": "Koramangala, Bangalore",
        "registration_number": "U99999KA2021PTC999999",
        "gst_number": "29DDDDD1234D1Z3",
        "bank_account_number": "554433221100",
        "ifsc_code": "SBIN0001111"
    }
    v_res = client.post("/api/vendors", json=vendor_payload)
    vendor_id = v_res.json()["id"]

    # Upload document with DIFFERENT company name / registration (e.g. from sample registration which has ABC Technologies)
    sample_files = ensure_sample_pdfs()
    with open(sample_files["registration"], "rb") as f:
        file_content = f.read()

    client.post(
        f"/api/vendors/{vendor_id}/documents",
        data={"document_type": "REGISTRATION_CERTIFICATE", "auto_extract": "true"},
        files={"file": ("registration.pdf", file_content, "application/pdf")}
    )

    # Run comparison
    comp_res = client.post(f"/api/vendors/{vendor_id}/compare")
    data = comp_res.json()
    assert data["has_mismatches"] is True

    # Move to UNDER_REVIEW
    client.patch(
        f"/api/vendors/{vendor_id}/workflow",
        json={"new_status": "UNDER_REVIEW"}
    )

    # Attempt to APPROVE while required documents are missing -> Must fail!
    approve_res = client.patch(
        f"/api/vendors/{vendor_id}/workflow",
        json={"new_status": "APPROVED", "reason": "Attempting unauthorized approval"}
    )
    assert approve_res.status_code == 400
    assert "Approval blocked" in approve_res.json()["detail"]

def test_scenario_d_version_restoration(client):
    """Scenario D: Vendor edits, history tracking, and version restoration."""
    vendor_payload = {
        "company_name": "Original Name Corp",
        "contact_person": "Olivia",
        "email": "olivia@original.com",
        "phone": "+91 95555 44444",
        "address": "Whitefield, Bangalore",
        "registration_number": "U11111KA2020PTC111111",
        "gst_number": "29EEEEE1234E1Z4",
        "bank_account_number": "778899001122",
        "ifsc_code": "HDFC0009999"
    }
    v_res = client.post("/api/vendors", json=vendor_payload)
    vendor_id = v_res.json()["id"]

    # Initial version exists
    v1_list = client.get(f"/api/vendors/{vendor_id}/versions").json()
    assert len(v1_list) == 1
    assert v1_list[0]["snapshot"]["company_name"] == "Original Name Corp"
    initial_version_id = v1_list[0]["id"]

    # Edit company name
    update_res = client.put(
        f"/api/vendors/{vendor_id}",
        json={"company_name": "Updated Name Technologies Ltd", "change_reason": "Rebranded legal name"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["company_name"] == "Updated Name Technologies Ltd"

    # Versions should now have 2 entries
    v2_list = client.get(f"/api/vendors/{vendor_id}/versions").json()
    assert len(v2_list) == 2
    assert v2_list[0]["version_number"] == 2
    assert v2_list[0]["changed_fields"]["company_name"]["new"] == "Updated Name Technologies Ltd"

    # Restore Version 1
    restore_res = client.post(
        f"/api/vendors/{vendor_id}/versions/{initial_version_id}/restore",
        json={"reason": "Reverting rebrand decision"}
    )
    assert restore_res.status_code == 200
    assert restore_res.json()["company_name"] == "Original Name Corp"

    # Versions should now have 3 entries (immutable audit trail!)
    v3_list = client.get(f"/api/vendors/{vendor_id}/versions").json()
    assert len(v3_list) == 3
    assert v3_list[0]["version_number"] == 3
    assert "Restored" in v3_list[0]["reason"]

def test_scenario_e_external_api_failure(client):
    """Scenario E: Simulation of external API timeout/errors without marking vendor invalid."""
    vendor_payload = {
        "company_name": "Timeout Simulation Co",
        "contact_person": "Timothy",
        "email": "tim@timeout.com",
        "phone": "+91 94444 33333",
        "address": "MG Road, Bangalore",
        "registration_number": "U33333KA2021PTC333333",
        "gst_number": "29FFFFF1234F1Z6",
        "bank_account_number": "123123123123",
        "ifsc_code": "KKBK0001234"
    }
    v_res = client.post("/api/vendors", json=vendor_payload)
    vendor_id = v_res.json()["id"]

    # Query with 'timeout' to simulate API network timeout
    verif_res = client.post(
        f"/api/vendors/{vendor_id}/verify-company",
        json={"query": "timeout simulation"}
    )
    assert verif_res.status_code == 200
    data = verif_res.json()
    assert data["outcome"] == "UNABLE_TO_VERIFY"
    assert "timed out" in data["mismatch_notes"].lower() or "timeout" in data["mismatch_notes"].lower()
    # Ensure vendor status is NOT invalidated
    vendor_info = client.get(f"/api/vendors/{vendor_id}").json()
    assert vendor_info["status"] != "REJECTED"

def test_scenario_f_upload_security(client):
    """Scenario F: File upload restrictions and error handling."""
    vendor_payload = {
        "company_name": "Security Test Enterprise",
        "contact_person": "Sam",
        "email": "sam@sectest.com",
        "phone": "+91 93333 22222",
        "address": "Koramangala, Bangalore",
        "registration_number": "U44444KA2021PTC444444",
        "gst_number": "29GGGGG1234G1Z7",
        "bank_account_number": "321321321321",
        "ifsc_code": "AXIS0001234"
    }
    v_res = client.post("/api/vendors", json=vendor_payload)
    vendor_id = v_res.json()["id"]

    # 1. Unsupported file format (e.g., .exe or .sh)
    bad_file = io.BytesIO(b"echo 'malicious code'")
    bad_upload = client.post(
        f"/api/vendors/{vendor_id}/documents",
        data={"document_type": "REGISTRATION_CERTIFICATE"},
        files={"file": ("malware.exe", bad_file, "application/octet-stream")}
    )
    assert bad_upload.status_code == 400
    assert "Unsupported file format" in bad_upload.json()["detail"]

    # 2. Invalid Vendor ID
    sample_files = ensure_sample_pdfs()
    with open(sample_files["registration"], "rb") as f:
        file_content = f.read()

    invalid_vendor_upload = client.post(
        "/api/vendors/999999/documents",
        data={"document_type": "REGISTRATION_CERTIFICATE"},
        files={"file": ("registration.pdf", file_content, "application/pdf")}
    )
    assert invalid_vendor_upload.status_code == 404

def test_scenario_g_discrepancy_resolution_and_dossier_pdf(client):
    """Scenario G: Discrepancy resolution with audit explanation and dossier PDF export."""
    vendor_payload = {
        "company_name": "Resolve Test Corp",
        "contact_person": "Robert",
        "email": "robert@resolvetest.com",
        "phone": "+91 91111 22222",
        "address": "Electronic City, Bangalore",
        "registration_number": "U55555KA2021PTC555555",
        "gst_number": "29HHHHH1234H1Z8",
        "bank_account_number": "555544443333",
        "ifsc_code": "ICIC0005555"
    }
    v_res = client.post("/api/vendors", json=vendor_payload)
    vendor_id = v_res.json()["id"]

    # Trigger initial comparison
    comp_res = client.post(f"/api/vendors/{vendor_id}/compare")
    assert comp_res.status_code == 200
    comparisons = comp_res.json()["comparisons"]
    assert len(comparisons) > 0

    comp_id = comparisons[0]["id"]
    # Resolve first comparison item
    resolve_res = client.patch(
        f"/api/vendors/{vendor_id}/comparisons/{comp_id}/resolve",
        json={
            "resolution_notes": "Verified against physical government gazette",
            "actor": "Lead Auditor"
        }
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["review_status"] == "RESOLVED"
    assert "RESOLVED by Lead Auditor" in resolve_res.json()["explanation"]

    # Test Vendor Dossier PDF generation
    dossier_res = client.get(f"/api/vendors/{vendor_id}/dossier-pdf")
    assert dossier_res.status_code == 200
    assert "application/pdf" in dossier_res.headers["content-type"]
    assert len(dossier_res.content) > 1000

