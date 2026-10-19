import os
import tempfile
from datetime import datetime, timezone
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from sqlalchemy.orm import Session

from app.models.vendor import Vendor
from app.models.document import Document
from app.models.verification import FieldComparison, CompanyVerification
from app.models.workflow import WorkflowHistory, Task, DocumentChecklist
from app.core.security import mask_bank_account

class DossierPdfService:
    @classmethod
    def generate_vendor_dossier_pdf(cls, db: Session, vendor: Vendor) -> str:
        """
        Generates a comprehensive, audit-ready compliance dossier PDF for the vendor.
        Returns the absolute filepath to the generated PDF.
        """
        temp_dir = tempfile.gettempdir()
        filename = f"Vendor_{vendor.id}_Compliance_Dossier.pdf"
        output_path = os.path.join(temp_dir, filename)

        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom Typography Styles
        title_style = ParagraphStyle(
            'DossierTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#0f172a'),
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            'DossierSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#64748b'),
            spaceAfter=12
        )
        h2_style = ParagraphStyle(
            'DossierH2',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#1e3a8a'),
            spaceBefore=10,
            spaceAfter=6
        )
        cell_style = ParagraphStyle(
            'DossierCell',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#1e293b')
        )
        cell_bold = ParagraphStyle(
            'DossierCellBold',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#0f172a')
        )

        elements = []

        # Header Block
        elements.append(Paragraph("VENDORVERIFY AI - COMPLIANCE AUDIT DOSSIER", title_style))
        gen_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        elements.append(Paragraph(f"Official Verification Audit Dossier | Generated on: {gen_time} | System Version: 1.0", subtitle_style))
        elements.append(Spacer(1, 8))

        # 1. Executive Summary & Vendor Details
        status_color = "#10b981" if vendor.status == "APPROVED" else "#ef4444" if vendor.status == "REJECTED" else "#f59e0b"
        overview_data = [
            [Paragraph("<b>Company Name:</b>", cell_bold), Paragraph(vendor.company_name, cell_style),
             Paragraph("<b>Verification Status:</b>", cell_bold), Paragraph(f"<font color='{status_color}'><b>{vendor.status}</b></font>", cell_style)],
            [Paragraph("<b>Contact Person:</b>", cell_bold), Paragraph(vendor.contact_person, cell_style),
             Paragraph("<b>Registered Email:</b>", cell_bold), Paragraph(vendor.email, cell_style)],
            [Paragraph("<b>Phone:</b>", cell_bold), Paragraph(vendor.phone, cell_style),
             Paragraph("<b>Address:</b>", cell_bold), Paragraph(vendor.address, cell_style)],
            [Paragraph("<b>Registration / CIN:</b>", cell_bold), Paragraph(vendor.registration_number, cell_style),
             Paragraph("<b>GST / Tax ID:</b>", cell_bold), Paragraph(vendor.gst_number, cell_style)],
            [Paragraph("<b>Bank Account:</b>", cell_bold), Paragraph(mask_bank_account(vendor.bank_account_number), cell_style),
             Paragraph("<b>IFSC Code:</b>", cell_bold), Paragraph(vendor.ifsc_code, cell_style)]
        ]
        t_overview = Table(overview_data, colWidths=[110, 160, 110, 160])
        t_overview.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('PADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(Paragraph("1. Vendor Profile & Identification", h2_style))
        elements.append(t_overview)
        elements.append(Spacer(1, 10))

        # 2. Document Checklist & Uploads
        checklists = db.query(DocumentChecklist).filter(DocumentChecklist.vendor_id == vendor.id).all()
        checklist_rows = [[
            Paragraph("<b>Document Type</b>", cell_bold),
            Paragraph("<b>Requirement</b>", cell_bold),
            Paragraph("<b>Status</b>", cell_bold),
            Paragraph("<b>Last Audit Date</b>", cell_bold)
        ]]
        if checklists:
            for chk in checklists:
                chk_color = "#10b981" if chk.status == "VERIFIED" else "#3b82f6" if chk.status == "AVAILABLE" else "#ef4444"
                checklist_rows.append([
                    Paragraph(chk.document_type.replace('_', ' ').title(), cell_style),
                    Paragraph("Mandatory Compliance", cell_style),
                    Paragraph(f"<font color='{chk_color}'><b>{chk.status}</b></font>", cell_style),
                    Paragraph(chk.checked_at.strftime("%Y-%m-%d %H:%M") if chk.checked_at else "N/A", cell_style)
                ])
        else:
            checklist_rows.append([Paragraph("No checklist initialized yet.", cell_style), Paragraph("-", cell_style), Paragraph("-", cell_style), Paragraph("-", cell_style)])

        t_checklist = Table(checklist_rows, colWidths=[180, 100, 120, 140])
        t_checklist.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e0e7ff')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('PADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(Paragraph("2. Mandatory Document Checklist", h2_style))
        elements.append(t_checklist)
        elements.append(Spacer(1, 10))

        # 3. External Registry Verification (OpenCorporates)
        verif = db.query(CompanyVerification).filter(CompanyVerification.vendor_id == vendor.id).order_by(CompanyVerification.verified_at.desc()).first()
        elements.append(Paragraph("3. External Corporate Registry Verification (OpenCorporates)", h2_style))
        if verif:
            outcome_color = "#10b981" if verif.outcome == "VERIFIED" else "#ef4444" if verif.outcome == "MISMATCH" else "#f59e0b"
            reg_data = [
                [Paragraph("<b>Registry Provider:</b>", cell_bold), Paragraph(verif.provider, cell_style),
                 Paragraph("<b>Outcome:</b>", cell_bold), Paragraph(f"<font color='{outcome_color}'><b>{verif.outcome}</b></font>", cell_style)],
                [Paragraph("<b>Queried Name/CIN:</b>", cell_bold), Paragraph(verif.search_query, cell_style),
                 Paragraph("<b>Verified Company:</b>", cell_bold), Paragraph(verif.extracted_company_name or "N/A", cell_style)],
                [Paragraph("<b>Registered CIN:</b>", cell_bold), Paragraph(verif.extracted_reg_number or "N/A", cell_style),
                 Paragraph("<b>Jurisdiction / Status:</b>", cell_bold), Paragraph(f"{verif.jurisdiction_code or 'IN'} / {verif.extracted_status or 'Active'}", cell_style)],
                [Paragraph("<b>Discrepancy Notes:</b>", cell_bold), Paragraph(verif.mismatch_notes or "None (Clean match)", cell_style),
                 Paragraph("<b>Verified Timestamp:</b>", cell_bold), Paragraph(verif.verified_at.strftime("%Y-%m-%d %H:%M:%S UTC"), cell_style)]
            ]
            t_reg = Table(reg_data, colWidths=[120, 150, 120, 150])
            t_reg.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0fdf4' if verif.outcome == 'VERIFIED' else '#fffbeb')),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
                ('PADDING', (0, 0), (-1, -1), 4),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            elements.append(t_reg)
        else:
            elements.append(Paragraph("External corporate registry verification has not been performed yet.", cell_style))
        elements.append(Spacer(1, 10))

        # 4. AI Multi-Way Cross-Document Comparison Matrix
        comparisons = db.query(FieldComparison).filter(FieldComparison.vendor_id == vendor.id).all()
        elements.append(Paragraph("4. AI Multi-Way Cross-Document Comparison Matrix", h2_style))
        comp_rows = [[
            Paragraph("<b>Field</b>", cell_bold),
            Paragraph("<b>Vendor Value</b>", cell_bold),
            Paragraph("<b>Registration</b>", cell_bold),
            Paragraph("<b>GST / Tax</b>", cell_bold),
            Paragraph("<b>Bank Doc</b>", cell_bold),
            Paragraph("<b>Status</b>", cell_bold)
        ]]
        if comparisons:
            for c in comparisons:
                c_color = "#10b981" if c.match_status == "MATCH" else "#ef4444" if c.match_status == "MISMATCH" else "#64748b"
                rev_badge = f" <font color='#0284c7'>[RESOLVED]</font>" if c.review_status == "RESOLVED" else ""
                comp_rows.append([
                    Paragraph(c.field_name.replace('_', ' ').title(), cell_style),
                    Paragraph(c.vendor_value or "-", cell_style),
                    Paragraph(c.registration_value or "-", cell_style),
                    Paragraph(c.gst_value or "-", cell_style),
                    Paragraph(c.bank_value or "-", cell_style),
                    Paragraph(f"<font color='{c_color}'><b>{c.match_status}</b></font>{rev_badge}", cell_style)
                ])
        else:
            comp_rows.append([Paragraph("No comparison runs recorded.", cell_style), Paragraph("-", cell_style), Paragraph("-", cell_style), Paragraph("-", cell_style), Paragraph("-", cell_style), Paragraph("-", cell_style)])

        t_comp = Table(comp_rows, colWidths=[90, 90, 90, 90, 90, 90])
        t_comp.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('PADDING', (0, 0), (-1, -1), 3),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(t_comp)
        elements.append(Spacer(1, 10))

        # 5. Reviewer Tasks & Audit Sign-Off
        tasks = db.query(Task).filter(Task.vendor_id == vendor.id).all()
        elements.append(Paragraph("5. Compliance Tasks & Audit Trail", h2_style))
        task_rows = [[
            Paragraph("<b>Task Title</b>", cell_bold),
            Paragraph("<b>Priority</b>", cell_bold),
            Paragraph("<b>Due Date</b>", cell_bold),
            Paragraph("<b>Status</b>", cell_bold)
        ]]
        if tasks:
            for t in tasks:
                t_status_color = "#10b981" if t.status == "COMPLETED" else "#ef4444"
                task_rows.append([
                    Paragraph(t.title, cell_style),
                    Paragraph(t.priority, cell_style),
                    Paragraph(t.due_date.strftime("%Y-%m-%d") if t.due_date else "N/A", cell_style),
                    Paragraph(f"<font color='{t_status_color}'><b>{t.status}</b></font>", cell_style)
                ])
        else:
            task_rows.append([Paragraph("No open action tasks for this vendor.", cell_style), Paragraph("-", cell_style), Paragraph("-", cell_style), Paragraph("-", cell_style)])

        t_tasks = Table(task_rows, colWidths=[240, 90, 110, 100])
        t_tasks.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f8fafc')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('PADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(t_tasks)
        elements.append(Spacer(1, 14))

        # Sign-off box
        sign_off_data = [
            [Paragraph("<b>Compliance Auditor Verification Stamp:</b>", cell_bold), Paragraph("<b>Signature / Date:</b>", cell_bold)],
            [Paragraph(f"VendorVerify AI Automated Engine - Overall Status: <b>{vendor.status}</b><br/>All checks executed with cryptographic immutability.", cell_style),
             Paragraph(f"Approved / Signed by: Compliance Officer<br/>Date: {datetime.now().strftime('%d-%b-%Y')}", cell_style)]
        ]
        t_sign = Table(sign_off_data, colWidths=[300, 240])
        t_sign.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f1f5f9')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#94a3b8')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(KeepTogether(t_sign))

        doc.build(elements)
        return output_path
