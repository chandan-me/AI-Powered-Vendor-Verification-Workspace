# Official Project Submission Document

**Project Title:** AI-Powered Autonomous Vendor Verification & Compliance Workspace  
**Candidate / Submitter:** Chandan  
**GitHub Repository:** [https://github.com/chandan-me/AI-Powered-Vendor-Verification-Workspace](https://github.com/chandan-me/AI-Powered-Vendor-Verification-Workspace)  
**Submission Date:** October 19, 2026  

---

## 📋 Submission Checklist (All 6 Deliverables)

| Deliverable | Location / Resource | Status |
| :--- | :--- | :--- |
| **1. Video Demonstration** | **[PASTE YOUR VIDEO LINK HERE]** *(e.g. YouTube / Loom / Google Drive)* | 🎥 Ready for Link |
| **2. Source Code** | [GitHub: chandan-me/AI-Powered-Vendor-Verification-Workspace](https://github.com/chandan-me/AI-Powered-Vendor-Verification-Workspace) | ✅ Public & Pushed |
| **3. Database / Schema** | [`database_schema.sql`](file:///c:/Users/user/.gemini/antigravity-ide/scratch/vendorverify-ai/database_schema.sql) (11 normalized MySQL 8.0 tables) | ✅ Complete DDL |
| **4. Comprehensive README** | [`README.md`](file:///c:/Users/user/.gemini/antigravity-ide/scratch/vendorverify-ai/README.md) (Step-by-step setup, APIs & Mailpit guide) | ✅ Complete |
| **5. Architecture Explanation** | [`ARCHITECTURE.md`](file:///c:/Users/user/.gemini/antigravity-ide/scratch/vendorverify-ai/ARCHITECTURE.md) (4-Tier breakdown & Mermaid diagrams) | ✅ Complete |
| **6. Working Application** | Full-Stack setup running locally on ports 5173, 8000, 3306, 1025, 8025 | ✅ Tested & Passing |

---

## 🎥 1. Video Demonstration

> **Video Link:** `PASTE_YOUR_LINK_HERE`  
> *(Recommended hosting: YouTube Unlisted, Google Drive with "Anyone with link can view", or Loom)*

### Video Structure & Covered Modules:
- **00:00 – 01:00:** Problem Statement, System Overview & Tech Stack (FastAPI, React 18, MySQL 8, OpenAI GPT-4o-mini, OpenCorporates, Mailpit SMTP).
- **01:00 – 02:30:** Vendor Onboarding Form with strict validation (blocking special characters, blocking single words, numbers-only phone and bank accounts).
- **02:30 – 04:00:** Multi-Document Ingestion & AI Entity Extraction (PDF text extraction, confidence scoring, exact citation sources, sensitive banking masking `********1234`).
- **04:00 – 05:30:** 5-Way Comparison Matrix & Discrepancy Detection (Cross-source audit between Vendor Form, Incorporation Cert, GST Cert, Bank Statement, and Corporate Registry).
- **05:30 – 07:00:** External Corporate Registry Integration (OpenCorporates v0.4 search by CIN / Company Name with offline error resilience).
- **07:00 – 08:15:** Automated Email Workflows & Gated Approval (Missing documents detection, local Mailpit SMTP inbox inspection on port 8025, blocking premature approval).
- **08:15 – 09:15:** Snapshot Version Control, Visual Diffs & 1-Click Rollback (Tamper-evident audit trail, reverting erroneous edits).
- **09:15 – 10:00:** Certified Compliance Dossier PDF Export (ReportLab), automated test suite execution (`pytest` 7/7 passing), and wrap-up.

---

## 💻 2. Source Code & GitHub Repository

* **Repository URL:** [https://github.com/chandan-me/AI-Powered-Vendor-Verification-Workspace](https://github.com/chandan-me/AI-Powered-Vendor-Verification-Workspace)
* **Branch:** `main`
* **Clean Code Structure:**
  * `/backend`: FastAPI Python 3.12 modular application (Services, Models, Schemas, API Routes).
  * `/frontend`: React 18, TypeScript, Vite, Tailwind CSS with reusable components.
  * `/sample_documents`: Realistic enterprise test PDFs for instant 1-click verification.

---

## 🗄️ 3. Database & Schema

* **Schema File:** [`database_schema.sql`](file:///c:/Users/user/.gemini/antigravity-ide/scratch/vendorverify-ai/database_schema.sql)
* **Database Engine:** MySQL 8.0+ / SQLite compatibility layer.
* **11 Normalized Tables:**
  1. `vendors`: Core master entity data and masked financial fields.
  2. `documents`: Uploaded compliance files and metadata.
  3. `document_extractions`: Extracted JSON entities, OCR confidence scores, and raw quotes.
  4. `field_comparisons`: 5-way deterministic cross-comparison ledger with discrepancy statuses.
  5. `company_verifications`: OpenCorporates API responses, registry numbers, and verification outcomes.
  6. `document_checklists`: Real-time tracking of mandatory vs optional compliance documents.
  7. `workflow_histories`: Immutable chronological state transitions (`DRAFT` → `UNDER_REVIEW` → `APPROVED`).
  8. `tasks`: Action items and auditor remediation tickets for discrepancies.
  9. `vendor_versions`: Point-in-time snapshot ledger supporting visual diffs and 1-click rollback.
  10. `email_notifications`: Dispatched compliance emails with subject, recipient, and RFC 822 body.
  11. `system_settings`: Key-value configuration for API keys, email thresholds, and model parameters.

---

## 📖 4. README & Setup Instructions

* **Full Guide:** [`README.md`](file:///c:/Users/user/.gemini/antigravity-ide/scratch/vendorverify-ai/README.md)
* **Fast Start (3 Commands):**
  ```bash
  # 1. Start Mailpit container (for local emails)
  docker run -d --name mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit

  # 2. Start Backend (Terminal 1)
  cd backend && python -m uvicorn app.main:app --port 8000

  # 3. Start Frontend (Terminal 2)
  cd frontend && npm run dev
  ```
* **Accessible URLs:**
  * **Frontend UI:** `http://localhost:5173`
  * **Backend API Docs (Swagger):** `http://localhost:8000/docs`
  * **Mailpit Email Inbox:** `http://localhost:8025`

---

## 🏛️ 5. Brief Architecture Explanation

* **Full Document:** [`ARCHITECTURE.md`](file:///c:/Users/user/.gemini/antigravity-ide/scratch/vendorverify-ai/ARCHITECTURE.md)
* **4-Tier Architecture Summary:**
  1. **Presentation Tier:** React 18 SPA with real-time keystroke sanitization, state-machine stepper pipeline, and responsive Tailwind UI.
  2. **API & Business Logic Tier:** FastAPI REST backend enforcing zero-trust Pydantic validation, asynchronous file streaming, and service-oriented architecture.
  3. **Intelligence & Integration Tier:**
     * Dual-engine document extractor (PyMuPDF + Tesseract OCR + OpenAI GPT-4o-mini).
     * Deterministic 5-way comparison engine with string normalization.
     * External OpenCorporates registry verification adapter with built-in fault tolerance.
     * Automated SMTP email delivery engine.
  4. **Persistence & Audit Tier:** MySQL 8.0 relational schema, immutable snapshot versioning, and ReportLab PDF document compiler.

---

## 🧪 6. Automated Verification & Quality Assurance

* **Pytest Suite:** 7 automated scenario tests covering the entire compliance lifecycle:
  ```bash
  pytest backend/tests/test_scenarios.py -v
  # Result: 7 passed in 9.01s (100% Pass Rate)
  ```
* **End-to-End Verification Script:**
  ```bash
  python verify_all.py
  # Result: All 6 modules verified successfully!
  ```
* **TypeScript & Vite Build:**
  ```bash
  cd frontend && npm run build
  # Result: 0 errors (tsc && vite build succeeded)
  ```
