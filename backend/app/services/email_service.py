import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import resend

from app.core.config import settings
from app.core.logging import logger
from app.models.vendor import Vendor
from app.models.workflow import EmailNotification

class EmailService:
    @classmethod
    def _deliver_and_record(
        cls,
        db: Session,
        vendor: Vendor,
        subject: str,
        body_text: str,
        missing_documents: Optional[List[str]] = None,
        email_type: str = "GENERAL"
    ) -> EmailNotification:
        """Delivers email via Mailpit SMTP or configured provider, and records audit record in database."""
        notification_record = EmailNotification(
            vendor_id=vendor.id,
            recipient_email=vendor.email,
            subject=subject,
            body_text=body_text,
            missing_documents=missing_documents,
            provider="mailpit",
            status="SENT",
            sent_at=datetime.now(timezone.utc)
        )

        delivered = False

        # 1. Primary: Deliver via SMTP (Mailpit on localhost:1025)
        if settings.SMTP_HOST:
            try:
                msg = MIMEMultipart("alternative")
                msg["From"] = settings.EMAIL_FROM
                msg["To"] = vendor.email
                msg["Subject"] = subject
                msg.attach(MIMEText(body_text, "plain"))

                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=5) as server:
                    if settings.SMTP_USE_TLS:
                        server.starttls()
                    if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                    server.send_message(msg)

                notification_record.provider = "mailpit"
                notification_record.status = "SENT"
                notification_record.provider_message_id = f"mailpit_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
                delivered = True
                logger.info(f"[MAILPIT EMAIL SENT] Delivered via SMTP ({settings.SMTP_HOST}:{settings.SMTP_PORT}) to {vendor.email} | Type: {email_type} | Subject: '{subject}'")
            except Exception as e:
                logger.warning(f"SMTP delivery to Mailpit failed ({e}). Attempting fallback...")

        # 2. Secondary: Resend API if configured and SMTP didn't deliver
        if not delivered and settings.is_resend_configured and not settings.DEMO_MODE:
            try:
                resend.api_key = settings.RESEND_API_KEY
                params = {
                    "from": settings.EMAIL_FROM,
                    "to": [vendor.email],
                    "subject": subject,
                    "text": body_text,
                }
                email_res = resend.Emails.send(params)
                notification_record.provider = "resend"
                notification_record.status = "SENT"
                notification_record.provider_message_id = str(email_res.get("id", ""))
                delivered = True
                logger.info(f"Email successfully sent via Resend API: ID={notification_record.provider_message_id}")
            except Exception as e:
                logger.error(f"Resend API error: {e}")

        # 3. Tertiary: Fallback to simulated demo delivery if network/SMTP unavailable
        if not delivered:
            notification_record.provider = "demo_sandbox"
            notification_record.status = "DEMO_SIMULATED"
            notification_record.provider_message_id = f"demo_msg_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
            logger.info(f"[DEMO SIMULATED EMAIL] To: {vendor.email} | Subject: '{subject}'")

        db.add(notification_record)
        db.commit()
        db.refresh(notification_record)
        return notification_record

    @classmethod
    def send_missing_documents_notice(
        cls,
        db: Session,
        vendor: Vendor,
        missing_doc_names: List[str],
        force: bool = False
    ) -> EmailNotification:
        """Sends an automated missing documents notice with idempotency and audit record."""
        if not force:
            recent_sent = db.query(EmailNotification).filter(
                EmailNotification.vendor_id == vendor.id,
                EmailNotification.subject.ilike("%Missing Documentation%"),
                EmailNotification.status.in_(["SENT", "DEMO_SIMULATED"]),
                EmailNotification.sent_at >= datetime.now(timezone.utc) - timedelta(minutes=30)
            ).first()
            if recent_sent:
                logger.info(f"Duplicate missing docs email suppressed for vendor {vendor.id} (sent within last 30m).")
                return recent_sent

        subject = f"Action Required: Missing Documentation for {vendor.company_name} Onboarding"
        docs_list_text = "\n".join([f"  • {name}" for name in missing_doc_names])
        body_text = f"""Dear {vendor.contact_person},

We are currently reviewing the vendor onboarding dossier for {vendor.company_name}.
Our automated verification audit identified that the following mandatory document(s) are currently missing:

{docs_list_text}

Required Next Steps:
1. Please reply directly to this notice or upload the missing documents in PDF format to our compliance portal ({settings.EMAIL_FROM}).
2. Ensure that legal entity names and tax identifiers strictly match your registered corporate details.
3. If you have already submitted these items, please contact your compliance reviewer immediately.

Sincerely,
Vendor Verification & Compliance Operations Team
{settings.APP_NAME}
"""
        return cls._deliver_and_record(
            db=db,
            vendor=vendor,
            subject=subject,
            body_text=body_text,
            missing_documents=missing_doc_names,
            email_type="MISSING_DOCS"
        )

    @classmethod
    def send_approval_notice(
        cls,
        db: Session,
        vendor: Vendor,
        actor: str = "Compliance Reviewer"
    ) -> EmailNotification:
        """Sends an automated onboarding approval notice when vendor is APPROVED."""
        subject = f"Approved: Vendor Onboarding Clearance for {vendor.company_name}"
        body_text = f"""Dear {vendor.contact_person},

Congratulations! We are pleased to inform you that {vendor.company_name} has successfully completed our enterprise compliance and vendor verification process.

Onboarding Clearance Summary:
  • Legal Entity Name: {vendor.company_name}
  • Corporate Identification No (CIN): {vendor.registration_number or 'N/A'}
  • GSTIN / Tax ID: {vendor.gst_number or 'N/A'}
  • Approved By: {actor}
  • Verification Status: APPROVED & VERIFIED (100% Match)

Next Steps:
Your vendor profile is now active in our procurement ERP system. You may now receive purchase orders, submit invoices, and initiate commercial engagements.

Thank you for your cooperation during our compliance audit.

Sincerely,
Vendor Verification & Compliance Operations Team
{settings.APP_NAME}
"""
        return cls._deliver_and_record(
            db=db,
            vendor=vendor,
            subject=subject,
            body_text=body_text,
            email_type="APPROVAL"
        )

    @classmethod
    def send_rejection_notice(
        cls,
        db: Session,
        vendor: Vendor,
        reason: Optional[str] = None,
        actor: str = "Compliance Reviewer"
    ) -> EmailNotification:
        """Sends an automated onboarding rejection notice when vendor is REJECTED."""
        subject = f"Notice: Vendor Onboarding Status for {vendor.company_name}"
        body_text = f"""Dear {vendor.contact_person},

Thank you for your interest in onboarding {vendor.company_name} with our organization.

After a thorough compliance audit, we regret to inform you that your vendor application cannot be approved at this time.

Reason for Decision:
{reason or 'The submitted compliance documentation failed to satisfy our enterprise verification criteria.'}

Reviewed By: {actor}

If you believe this determination was made in error or if your corporate credentials have changed, you may contact our compliance desk at {settings.EMAIL_FROM} with supporting documentation.

Sincerely,
Vendor Verification & Compliance Operations Team
{settings.APP_NAME}
"""
        return cls._deliver_and_record(
            db=db,
            vendor=vendor,
            subject=subject,
            body_text=body_text,
            email_type="REJECTION"
        )

    @classmethod
    def send_action_required_notice(
        cls,
        db: Session,
        vendor: Vendor,
        reason: Optional[str] = None,
        actor: str = "Compliance Reviewer"
    ) -> EmailNotification:
        """Sends an automated notice when action is required due to audit discrepancies."""
        subject = f"Action Required: Compliance Review Discrepancies for {vendor.company_name}"
        body_text = f"""Dear {vendor.contact_person},

During our automated verification review of {vendor.company_name}, our audit system identified discrepancy items requiring your attention before review can continue.

Details:
{reason or 'Discrepancies identified between legal registration, tax certificates, or corporate registry records.'}

Flagged By: {actor}

Please review your submitted documents and provide updated or matching certificates to our compliance desk ({settings.EMAIL_FROM}).

Sincerely,
Vendor Verification & Compliance Operations Team
{settings.APP_NAME}
"""
        return cls._deliver_and_record(
            db=db,
            vendor=vendor,
            subject=subject,
            body_text=body_text,
            email_type="ACTION_REQUIRED"
        )
