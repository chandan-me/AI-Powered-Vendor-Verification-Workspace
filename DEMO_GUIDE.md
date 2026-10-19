# VendorVerify AI – 5-Minute Demonstration Script

Use this minute-by-minute walkthrough to record your 5-minute demo video (via Loom, OBS, or Zoom) or provide it directly to evaluators for an interactive evaluation.

---

## Demo Timeline (0:00 – 5:00)

### ⏱️ Minute 0:00 – 0:45: Introduction & Architecture Overview
1. **Introduction**:
   - Introduce **VendorVerify AI**: An autonomous enterprise vendor onboarding and compliance verification platform.
   - Mention the core problem: Manual vendor auditing is slow, manual, and vulnerable to fraud.
   - Highlight the stack: **FastAPI (Python 3.12)** backend, **React 18 + TypeScript + Vite** frontend, **MySQL 8.0**, **OpenAI GPT-4o-mini**, **OpenCorporates**, and **Mailpit SMTP**.
2. **Dashboard Overview**:
   - Show the live dashboard at [http://localhost:5173](http://localhost:5173).
   - Point out key metrics: Total Vendors, In Review, Action Required, Approved, Verification Rate.
   - Click **"Download Report PDF"** in the top navbar to show dynamic ReportLab PDF delivery.

---

### ⏱️ Minute 0:45 – 2:00: 1-Click Perfect Match & 3-Company Suite
1. **Sample Compliance Hub**:
   - Scroll to the **"Sample Compliance Hub: 3 Separate Companies & Fake PDFs"** section on the dashboard.
   - Show the 3 separate enterprise companies:
     - **Zenith Cloud Technologies Pvt Ltd**
     - **Nexus Enterprise Solutions Pvt Ltd**
     - **Apex Logistics & Supply Chain Pvt Ltd**
   - Click on one of the PDF preview buttons (e.g., `[Inc Cert]`) to show the professionally formatted fake compliance certificate.
2. **1-Click 100% Match Seed**:
   - Click the green **"1-Click 100% Match"** button in the navbar.
   - Show toast notification: Vendor created, 3 certificates uploaded, AI extraction executed, and OpenCorporates verified.
   - Navigate to the newly created vendor detail page (`/vendors/{id}`).

---

### ⏱️ Minute 2:00 – 3:15: Deep-Dive into Vendor Workspace
1. **Overview Tab & Bank Account Masking**:
   - Show the bank account masked as `********1234` for sensitive data privacy.
   - Click the eye icon to authorize and reveal the real bank account on demand.
2. **Documents & AI Extraction Tab**:
   - Show the 3 uploaded documents (Certificate of Incorporation, GST REG-06, Bank Statement).
   - Expand an extraction: Show the structured JSON, **96% confidence score**, and the exact quoted snippet from the PDF.
3. **5-Way AI Comparison Matrix**:
   - Switch to the **"AI Comparison Matrix"** tab.
   - Highlight that all 5 critical fields (Company Name, Registration, GSTIN, Bank Account, IFSC) show bright green **`MATCH`** badges across the 5 independent data sources.
4. **Corporate Registry Verification**:
   - Show the OpenCorporates tab showing status: **`Active`**, jurisdiction: **`in`**, and verified CIN.
5. **Download Certified Dossier PDF**:
   - Click **"Download Compliance Dossier PDF"** to open the dynamically generated, multi-page ReportLab compliance report.

---

### ⏱️ Minute 3:15 – 4:15: Email Automation with Mailpit & Workflow Gating
1. **Missing Document Flow**:
   - On the vendor checklist tab, click **"Re-check Missing Documents"**.
   - Show that the system detects any missing mandatory documents and transitions status to `ACTION_REQUIRED`.
2. **Inspect Mailpit Inbox**:
   - Switch browser tab to **Mailpit** at [http://localhost:8025](http://localhost:8025).
   - Open the latest email notice: Show recipient, subject (`Action Required: Missing Documentation...`), and RFC 822 formatted body text.
3. **Approval Gates**:
   - Return to the app and attempt to click **"Approve Vendor"** while documents are missing or discrepancies exist.
   - Show the system blocking unauthorized approval and generating a high-priority remediation task for the auditor.

---

### ⏱️ Minute 4:15 – 5:00: Snapshot Version History & 1-Click Rollback
1. **Edit Profile**:
   - Click **"Edit Profile"** on the vendor detail page.
   - Change the Company Name (e.g., add *"Rebranded Global Ltd"*).
   - Enter Change Reason: *"Corporate Rebrand"* and save.
2. **Inspect Version Diff**:
   - Switch to the **"Version History"** tab.
   - Show the visual diff highlighting the modified company name.
3. **1-Click Rollback**:
   - Click **"Restore This Version"** on Version 1.
   - Demonstrate that the vendor instantly reverts to the original legal name while creating Version 3 to maintain an immutable audit trail.
4. **Conclusion**:
   - Conclude by noting the passing automated test suite (`pytest` 7/7 passed, `verify_all.py` completed).
