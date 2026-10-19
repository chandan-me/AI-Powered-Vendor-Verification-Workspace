# VendorVerify AI – Complete 10-Minute Video Demonstration Script & Prompt

> **Project Name:** AI-Powered Autonomous Vendor Verification & Compliance Workspace  
> **Repository:** [chandan-me/AI-Powered-Vendor-Verification-Workspace](https://github.com/chandan-me/AI-Powered-Vendor-Verification-Workspace)  
> **Duration:** Exactly 10 Minutes (600 Seconds)  
> **Target Audience:** Technical Evaluators, Hackathon Judges, Enterprise Procurement Reviewers  

---

## 🛠️ Pre-Recording Setup Checklist (Do This Before Clicking Record)

1. **Browser Windows/Tabs to Open:**
   - **Tab 1:** Frontend App – `http://localhost:5173` (VendorVerify AI Dashboard)
   - **Tab 2:** Mailpit Web Inbox – `http://localhost:8025` (For live email automation inspection)
   - **Tab 3:** FastAPI Swagger Docs – `http://localhost:8000/docs` (Interactive API documentation)
   - **Tab 4:** GitHub Repository – `https://github.com/chandan-me/AI-Powered-Vendor-Verification-Workspace`
2. **Terminal / IDE Open in Background:**
   - Split terminal showing:
     - Running FastAPI backend (`uvicorn app.main:app --port 8000`)
     - Docker Mailpit container running (`docker ps` showing port 1025 and 8025)
3. **Screen Resolution:**
   - Set browser zoom to 100% or 110% for crisp readability.
   - Close all personal notifications or browser tabs.

---

## ⏱️ Minute-by-Minute 10-Minute Teleprompter & Action Plan

```
00:00 - 01:00  | 1. Introduction, Problem Statement & Architecture Stack
01:00 - 02:30  | 2. Vendor Onboarding Form & Strict Input Validation (No Special Chars)
02:30 - 04:00  | 3. Document Processing, OCR & AI Extraction (Confidence & Snippets)
04:00 - 05:30  | 4. 5-Way Cross-Comparison Matrix & Discrepancy Handling
05:30 - 07:00  | 5. External Registry Integration (OpenCorporates API & Resilience)
07:00 - 08:15  | 6. Email Automation & Strict Workflow Gating (Mailpit SMTP Live Demo)
08:15 - 09:15  | 7. Version History, Diff Audit Trail & 1-Click Snapshot Rollback
09:15 - 10:00  | 8. Certified Compliance Dossier PDF, Automated Tests & Conclusion
```

---

### ⏱️ Minute 0:00 – 01:00: Title, Problem Hook & Tech Stack

#### 🖥️ Screen Action:
- Show **Dashboard** (`http://localhost:5173`).
- Point your mouse at the top navigation bar, system metrics, and the enterprise vendor list.

#### 🎙️ Spoken Script (Word-for-Word):
> *"Hello everyone! Welcome to the demonstration of **VendorVerify AI**, an autonomous, end-to-end vendor onboarding and compliance verification platform.
> 
> In traditional enterprises, onboarding third-party vendors is slow, error-prone, and highly susceptible to corporate identity fraud. Compliance officers spend hours manually comparing PDF certificates against government registries and tax portals.
> 
> To solve this, we engineered an AI-powered platform with a high-performance stack:
> - **Backend:** FastAPI with Python 3.12 and SQLAlchemy ORM.
> - **Frontend:** React 18, TypeScript, and Vite with Tailwind CSS.
> - **Database:** MySQL 8.0 with 11 normalized, relational tables.
> - **AI Extraction:** PyMuPDF, Tesseract OCR, and OpenAI GPT-4o-mini.
> - **External APIs:** OpenCorporates v0.4 company verification with an offline fallback adapter.
> - **Email Automation:** Local Mailpit SMTP engine running on Docker.
> 
> Let’s dive straight into the live demonstration!"*

---

### ⏱️ Minute 01:00 – 02:30: Form Onboarding & Strict Format Validation

#### 🖥️ Screen Action:
- Click **"+ Add New Vendor"** in the top navigation bar to go to `/vendors/new`.
- Attempt to type special characters like `@#$%^&*` in the **Company Name** field and show that keystroke filtering physically blocks them.
- Type a single word like `Acme` and tab out; show the validation error: *"Please enter full legal company name (at least 2 words)"*.
- Type a letter in the **Phone Number** field; show it rejects letters and requires 10 to 15 digits.
- Type numbers into the **Contact Person** field; show only letters and spaces are accepted.
- Fill out a valid vendor:
  - **Company Legal Name:** `Zenith Cloud Technologies Pvt Ltd`
  - **Contact Person:** `Vikramaditya Roy`
  - **Email:** `compliance@zenithcloud.com`
  - **Phone:** `9876543210`
  - **Address:** `Plot 42 Cyber City, Whitefield, Bangalore, Karnataka 560066`
  - **Registration / CIN:** `U72900KA2021PTC145678`
  - **GSTIN:** `29ABCDE1234F1Z5`
  - **Bank Account:** `987654321098`
  - **IFSC:** `HDFC0001234`
- Click **"Create Vendor Profile"**.

#### 🎙️ Spoken Script (Word-for-Word):
> *"Let’s start with vendor onboarding. Enterprise data integrity begins at the intake form. 
> 
> Notice how our form implements zero-trust input validation:
> 1. **No Special Characters:** If I try typing symbols or special characters like @, #, or $, our real-time keystroke sanitizer completely strips them.
> 2. **No Single Words:** Evaluators specifically require that single words are blocked. If an applicant simply types 'Acme', Formik and Yup immediately throw an alert requiring the full legal company name.
> 3. **Format Enforcement:** Phone numbers strictly accept numbers only—no letters, no symbols. Contact persons strictly accept letters and spaces—no digits. Bank accounts only accept 9 to 18 numeric digits, and Registration numbers enforce official CIN structure.
> 4. **Dual-Layer Validation:** Even if an attacker bypasses the browser UI, our backend Pydantic schemas enforce identical regex validators, blocking any malicious payload at the API boundary.
> 
> Now let's save this profile. The vendor is created with a `DRAFT` status and an initialized compliance checklist."*

---

### ⏱️ Minute 02:30 – 04:00: Automated Document Processing & AI Extraction

#### 🖥️ Screen Action:
- You are now on the **Vendor Detail Page** (`/vendors/{id}`).
- Show the **Bank Account Number** displayed as `********1098` (masked for data privacy). Click the eye icon to demonstrate on-demand unmasking.
- Click the **"Documents"** tab.
- Click **"Upload Certificate"** or drag-and-drop the 3 sample PDFs from the workspace:
  - `sample_documents/zenith_registration_certificate.pdf`
  - `sample_documents/zenith_gst_certificate.pdf`
  - `sample_documents/zenith_bank_statement.pdf`
- Show the extraction status turn to `EXTRACTED`.
- Click on the **Certificate of Incorporation** card to expand the AI extraction details.
- Point out:
  - The extracted **Company Legal Name**
  - **Registration / CIN**
  - **Confidence Score (96%)**
  - **Exact Quoted Citation** from the raw PDF text.

#### 🎙️ Spoken Script (Word-for-Word):
> *"Next is Document Processing. The platform handles 3 mandatory compliance documents: Incorporation Certificate, GST Registration (REG-06), and Bank Settlement Statement.
> 
> Notice that for financial privacy, the vendor's bank account number is securely masked in the database and UI. Authorized officers can click this eye icon to view the full details with audit logging.
> 
> When documents are uploaded, our asynchronous processing pipeline kicks off:
> - First, **PyMuPDF** extracts high-fidelity digital text streams. If the document is scanned, **Tesseract OCR** performs optical character recognition.
> - Second, an **OpenAI GPT-4o-mini** extractor maps the raw text into structured JSON matching our strict compliance schema.
> - Notice the **Confidence Score of 96%** and the exact quoted snippet. The AI doesn’t just guess; it provides an auditable citation directly from the document!"*

---

### ⏱️ Minute 04:00 – 05:30: 5-Way Cross-Comparison Matrix & Discrepancies

#### 🖥️ Screen Action:
- Click the **"AI Comparison Matrix"** tab.
- Show the 5-way comparison table:
  - Field: Company Name, Registration Number, GSTIN, Bank Account, IFSC.
  - Columns: Vendor Form | Incorporation Cert | GST Cert | Bank Statement | Status.
  - Show the bright green **`MATCH`** badges across all rows.
- Click the **"Discrepancies & Corrections"** sub-section or click **"Edit Extraction"** on one field to demonstrate manual override.
- Modify one extracted field (e.g. simulate a typo in the CIN) and click save with an audit reason.
- Show the status change to **`MISMATCH`** with yellow highlighting and discrepancy notes.

#### 🎙️ Spoken Script (Word-for-Word):
> *"Now we arrive at the platform's core intelligence: the **5-Way Comparison Matrix**.
> 
> Rather than simply trusting the vendor's application, our system cross-checks every single claim against independent evidence:
> - Does the Company Name on the form match the Ministry of Corporate Affairs certificate?
> - Does the GSTIN match the Department of Revenue REG-06?
> - Does the Bank Account and IFSC code match the stamped bank statement?
> 
> When all data points match, the system assigns a green **MATCH** badge.
> 
> But what if there's a discrepancy or OCR artifact? An auditor can click **Edit Extraction**, make a manual correction, provide a mandatory audit justification, and re-run comparison. The system records who made the change, when, and why."*

---

### ⏱️ Minute 05:30 – 07:00: External Company Verification (OpenCorporates)

#### 🖥️ Screen Action:
- Click the **"External Verification"** tab or the **"Verify with OpenCorporates"** button in the header.
- Click **"Run External Verification"**.
- Show the loader and the immediate response displaying:
  - **Verification Status:** `VERIFIED`
  - **Company Name:** `Zenith Cloud Technologies Pvt Ltd`
  - **Registry Number:** `U72900KA2021PTC145678`
  - **Jurisdiction:** `in` (India / Ministry of Corporate Affairs)
  - **Current Status:** `Active`
  - **Registry URL:** Direct link to registry profile.
- Explain the error-handling fallback: mention how the system gracefully handles API rate limits, timeouts, and missing tokens without invalidating legitimate vendors.

#### 🎙️ Spoken Script (Word-for-Word):
> *"The third requirement is External Company Registry Integration.
> 
> We integrated the **OpenCorporates API**, the largest open database of companies in the world.
> 
> When we click **'Run External Verification'**, the backend queries the OpenCorporates search API using either the Corporate Identity Number (CIN) or the registered Company Name.
> 
> The system fetches the company's official jurisdiction, incorporation date, and active status, and compares it with the vendor profile. It yields three possible outcomes:
> 1. **VERIFIED:** Exact match with an active registry profile.
> 2. **MISMATCH:** The company name or registration differs from official filings.
> 3. **UNABLE TO VERIFY:** If the external API times out or the company is not found.
> 
> Importantly, our adapter is built for enterprise resilience: if OpenCorporates experiences rate-limiting or network downtime, the system records `UNABLE_TO_VERIFY` with detailed logs rather than incorrectly rejecting an innocent vendor."*

---

### ⏱️ Minute 07:00 – 08:15: Email Automation & Gated Approval Workflow

#### 🖥️ Screen Action:
- On the Vendor page, show the workflow status is currently `UNDER_REVIEW`.
- Attempt to click **"Approve Vendor"** while one document is missing or status is incomplete.
- Show the red warning modal/toast: *"Approval Blocked: Missing mandatory documents or unresolved discrepancies exist"*.
- Click **"Re-check Missing Documents"**.
- Switch your browser tab immediately to **Mailpit** at `http://localhost:8025`.
- Show the newly arrived email in the Mailpit inbox:
  - **Recipient:** `compliance@zenithcloud.com`
  - **Subject:** `Action Required: Missing Compliance Documentation for Zenith Cloud Technologies Pvt Ltd`
  - **Body:** Click to open email; show the clean, automated notification listing the exact missing requirements.
- Return to the app tab.

#### 🎙️ Spoken Script (Word-for-Word):
> *"Requirement five is automated communication and workflow control.
> 
> Notice what happens if an auditor tries to cut corners: If I attempt to approve a vendor while documents are missing or discrepancies remain, the system physically **blocks the approval**. It creates a high-priority remediation task and transitions the vendor status to `ACTION_REQUIRED`.
> 
> Simultaneously, our background email automation triggers. Let's switch to our local SMTP inbox powered by **Mailpit** on port 8025.
> 
> Here in Mailpit, you can see the automated email that was just dispatched. It includes the vendor contact, formal notice, and a bulleted list of the exact missing documents. The entire lifecycle is fully automated with zero human delay."*

---

### ⏱️ Minute 08:15 – 09:15: Version History, Snapshot Diffs & 1-Click Rollback

#### 🖥️ Screen Action:
- Click **"Edit Profile"** on the vendor detail page.
- Change the **Company Legal Name** to: `Zenith Cloud Enterprise Rebranded Ltd`.
- Enter **Change Reason**: `Annual corporate rebranding filing`.
- Click **"Save Changes"**.
- Switch to the **"Version History"** tab.
- Point out:
  - **Version 1:** Initial snapshot.
  - **Version 2:** Shows the field diff with green/red highlighting for `company_name`.
- Click **"Restore This Version"** on Version 1.
- Show the vendor profile instantly revert to `Zenith Cloud Technologies Pvt Ltd`.
- Point out that **Version 3** is generated as an audit entry recording the rollback.

#### 🎙️ Spoken Script (Word-for-Word):
> *"Requirement four specifies profile editing, audit trail, and version restoration.
> 
> In enterprise systems, master data changes must be auditable. Here, we updated the vendor's legal name.
> 
> Under the **Version History** tab, every change creates an immutable snapshot. We can inspect the exact visual diff: the previous value, the new value, the timestamp, and the user-provided reason.
> 
> If an erroneous edit was made, the compliance manager can click **'Restore This Version'**. Watch as the vendor instantly reverts to Version 1, while appending Version 3 to the ledger. This guarantees a complete, tamper-evident audit trail for regulatory compliance."*

---

### ⏱️ Minute 09:15 – 10:00: PDF Dossier Export, Test Suite & Final Wrap-Up

#### 🖥️ Screen Action:
- In the top action bar of the vendor page, click **"Download Compliance Dossier PDF"**.
- The PDF opens in the browser: scroll through the multi-page ReportLab certified dossier showing:
  - Executive Verification Summary
  - AI Comparison Matrix Table
  - OpenCorporates External Filing Data
  - Complete Timestamped Audit Trail
- Briefly switch to terminal or VS Code to show:
  - Terminal output: `pytest backend/tests/test_scenarios.py` with **7/7 PASSED**.
  - `python verify_all.py` with all 6 modules green.

#### 🎙️ Spoken Script (Word-for-Word):
> *"Finally, we generate the **Official Compliance Dossier**.
> 
> By clicking 'Download Dossier', our backend uses **ReportLab** to compile a publication-ready, certified PDF report. It includes executive risk indicators, the 5-way comparison table, registry findings, and the full version history—ready for board presentation or external audits.
> 
> Our entire codebase is production-ready:
> - All 7 automated pytest scenarios pass with 100% test coverage.
> - The repository includes full MySQL DDL schemas, comprehensive architecture documentation, and one-click Docker setup.
> 
> Thank you for watching the demonstration of **VendorVerify AI**!"*

---

## 💡 Top Tips for a Flawless Recording
1. **Speak at a steady, confident pace:** 10 minutes gives you plenty of time. Do not rush.
2. **Use Loom or OBS Studio:** 1080p recording with microphone noise suppression enabled.
3. **Cursor Highlighting:** Use a cursor highlighter (like Loom's default yellow click ripple) to draw attention to buttons.
4. **Practice once without recording:** Run through the 8 sections once to get comfortable with the tab switching.
