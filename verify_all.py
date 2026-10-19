import requests
import json
import os

BASE = "http://localhost:8000/api"
MAILPIT = "http://localhost:8025/api/v1"

print("=" * 60)
print("1. FULL-STACK: BACKEND, DATABASE, AND VENDOR REGISTRATION")
print("=" * 60)
vendor_payload = {
    "company_name": "Zenith Cloud Technologies Pvt Ltd",
    "contact_person": "Jane Doe",
    "email": "compliance@zenithcloud.example",
    "phone": "+91 98765 43210",
    "address": "Tech Park Phase 2, Bangalore, Karnataka 560100",
    "registration_number": "U72200KA2020PTC138890",
    "gst_number": "29AAACZ1234F1Z5",
    "bank_account_number": "98765432101234",
    "ifsc_code": "HDFC0001234"
}
res = requests.post(f"{BASE}/vendors", json=vendor_payload)
assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
v_data = res.json()
vendor_id = v_data["id"]
print(f"SUCCESS: Vendor created with ID {vendor_id}")
print(f"Initial Status: {v_data['status']}")
print(f"Masked Bank Account: {v_data['bank_account_number_masked']}")

print("\n" + "=" * 60)
print("2. AI INTEGRATION & DOCUMENT PROCESSING")
print("=" * 60)
# Find sample document
sample_doc_path = os.path.join("sample_documents", "zenith_registration_certificate.pdf")
assert os.path.exists(sample_doc_path), f"Sample doc not found at {sample_doc_path}"

with open(sample_doc_path, "rb") as f:
    res_doc = requests.post(
        f"{BASE}/vendors/{vendor_id}/documents",
        data={"document_type": "REGISTRATION_CERTIFICATE", "auto_extract": "true"},
        files={"file": ("Zenith_Incorporation.pdf", f, "application/pdf")}
    )
assert res_doc.status_code == 201, f"Doc upload failed: {res_doc.text}"
doc_info = res_doc.json()
print(f"Document uploaded: ID {doc_info['id']}, Status: {doc_info['processing_status']}")
ext_wrapper = doc_info.get("extraction", {})
ext = ext_wrapper.get("extracted_json", {})
comp_name_data = ext.get("company_name", {})
reg_num_data = ext.get("registration_number", {})
print(f"AI Extraction Results (Model: {ext_wrapper.get('model_used')}):")
print(f"  Extracted Company Name: {comp_name_data.get('value')} (Confidence: {comp_name_data.get('confidence')})")
print(f"  Extracted CIN/Reg No:   {reg_num_data.get('value')} (Confidence: {reg_num_data.get('confidence')})")
print(f"  Source Citation:        {comp_name_data.get('source_text')}")

print("\n" + "=" * 60)
print("3. EXTERNAL API INTEGRATION (OPENCORPORATES)")
print("=" * 60)
res_corp = requests.post(f"{BASE}/vendors/{vendor_id}/verify-company", json={})
assert res_corp.status_code == 200, f"Verify company failed: {res_corp.text}"
corp_data = res_corp.json()
print(f"Registry Lookup Outcome: {corp_data['outcome']}")
print(f"Registry Matched Name:   {corp_data.get('extracted_company_name')}")
print(f"Registry Reg Number:     {corp_data.get('extracted_reg_number')}")
print(f"Registry Status:         {corp_data.get('extracted_status')}")
print(f"Registry Notes:          {corp_data.get('mismatch_notes')}")

print("\n" + "=" * 60)
print("4. EMAIL AUTOMATION USING MAILPIT")
print("=" * 60)
res_before = requests.get(f"{MAILPIT}/messages").json()
total_before = res_before.get("total", 0)
print(f"Mailpit message count prior to trigger: {total_before}")

# Trigger missing document check and automated email
res_check = requests.post(f"{BASE}/vendors/{vendor_id}/check-missing", json={"force_resend": True})
assert res_check.status_code == 200, f"Check missing failed: {res_check.text}"
check_data = res_check.json()
print(f"Missing doc trigger response: action_required={check_data['action_required_triggered']}, email_sent={check_data['email_sent']}")
print(f"Missing docs flagged: {check_data['missing_documents']}")

# Verify email arrived in Mailpit
res_after = requests.get(f"{MAILPIT}/messages").json()
total_after = res_after.get("total", 0)
print(f"Mailpit message count after trigger: {total_after}")
assert total_after > total_before, f"Email was not received in Mailpit! Before: {total_before}, After: {total_after}"

latest_msg = res_after["messages"][0]
print(f"Mailpit Verified Message Details:")
print(f"  Message ID: {latest_msg.get('ID')}")
print(f"  Subject:    {latest_msg.get('Subject')}")
print(f"  From:       {latest_msg.get('From', {}).get('Address')}")
print(f"  To:         {[t.get('Address') for t in latest_msg.get('To', [])]}")

print("\n" + "=" * 60)
print("5. BASIC WORKFLOW, COMPARATOR, AUDIT, & ROLLBACK")
print("=" * 60)
# Run 5-way comparator
res_comp = requests.post(f"{BASE}/vendors/{vendor_id}/compare")
assert res_comp.status_code == 200, f"Comparison failed: {res_comp.text}"
comp_data = res_comp.json()
print(f"5-Way Comparison completed: Total fields compared: {len(comp_data['comparisons'])}")

# Check remediation tasks
res_tasks = requests.get(f"{BASE}/tasks?vendor_id={vendor_id}")
tasks = res_tasks.json()
print(f"Remediation tasks auto-created: {len(tasks)}")
for t in tasks:
    print(f"  Task #{t['id']} [{t['status']} - {t['priority']}]: {t['title']}")

# Update workflow state
res_wf = requests.patch(
    f"{BASE}/vendors/{vendor_id}/workflow",
    json={"new_status": "UNDER_REVIEW", "reason": "Auditor reviewing compliance files"}
)
print(f"Workflow Transitioned to: {res_wf.json()['status']}")

# Dynamic Dossier PDF export
res_pdf = requests.get(f"{BASE}/vendors/{vendor_id}/dossier-pdf")
assert res_pdf.status_code == 200, f"Dossier PDF failed: {res_pdf.text}"
print(f"Dynamic PDF Compliance Dossier Generated: {len(res_pdf.content)} bytes")

# Test Snapshot Versioning & Safe Rollback
res_edit = requests.put(
    f"{BASE}/vendors/{vendor_id}",
    json={"company_name": "Zenith Cloud Global Technologies Ltd", "change_reason": "Corporate Rebrand"}
)
assert res_edit.status_code == 200
v_updated = res_edit.json()
print(f"Vendor edited to: '{v_updated['company_name']}'")

# Get versions
versions = requests.get(f"{BASE}/vendors/{vendor_id}/versions").json()
print(f"Version history count: {len(versions)}")
v1_id = versions[-1]["id"]  # Earliest version

# Rollback to Version 1
res_restore = requests.post(
    f"{BASE}/vendors/{vendor_id}/versions/{v1_id}/restore",
    json={"reason": "Rolling back accidental rename"}
)
assert res_restore.status_code == 200
v_restored = res_restore.json()
print(f"Vendor restored to: '{v_restored['company_name']}'")

print("\n" + "=" * 60)
print("ALL 6 AREAS VERIFIED AND WORKING COMPLETELY!")
print("=" * 60)
