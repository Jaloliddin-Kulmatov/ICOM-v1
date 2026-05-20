import os
import smtplib
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from models import AmbassadorApplication, User

ambassador_bp = Blueprint("ambassador", __name__)


def _send_emails_async(*args, **kwargs):
    """Fire-and-forget email sending in a daemon thread so the HTTP request
    returns immediately. SMTP can hang for 30+ seconds otherwise."""
    threading.Thread(
        target=_send_emails, args=args, kwargs=kwargs, daemon=True
    ).start()


def _send_emails(applicant_name: str, applicant_email: str, university: str, data: dict):
    """
    Send two emails:
      1. Confirmation to the applicant
      2. Notification to the admin (ADMIN_EMAIL)

    Requires in .env:
      SENDER_EMAIL    = your Gmail address (e.g. yourname@gmail.com)
      SENDER_PASSWORD = Gmail App Password (16-char, no spaces)
      ADMIN_EMAIL     = where YOU want to receive applications (can be same as SENDER_EMAIL)
    """
    sender_email    = os.environ.get("SENDER_EMAIL", "").strip()
    sender_password = os.environ.get("SENDER_PASSWORD", "").strip()
    admin_email     = os.environ.get("ADMIN_EMAIL", sender_email).strip()

    if not sender_email or not sender_password:
        print("[email] SENDER_EMAIL / SENDER_PASSWORD not set — skipping email.")
        return False

    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))

    # ── 1. Confirmation email to applicant ──────────────────────
    confirmation_html = f"""
<html><body style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1a1a2e">
  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;border-radius:12px 12px 0 0;text-align:center">
    <h1 style="color:white;margin:0;font-size:24px">ICOM</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:13px">International Community in Korea</p>
  </div>
  <div style="background:#f8f9ff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
    <h2 style="color:#1a1a2e;margin-top:0">Application Received! 🎉</h2>
    <p>Hi <strong>{applicant_name}</strong>,</p>
    <p>Thank you for applying to become an <strong>ICOM Ambassador</strong> for <strong>{university}</strong>!</p>
    <p>We've received your application and will review it within <strong>2–5 business days</strong>.
    We'll send you an email at this address when a decision is made.</p>
    <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:20px 0">
      <p style="margin:0;font-size:13px;color:#6b7280">Your application details:</p>
      <p style="margin:8px 0 0;font-size:14px"><strong>Name:</strong> {applicant_name}</p>
      <p style="margin:4px 0;font-size:14px"><strong>University:</strong> {university}</p>
      <p style="margin:4px 0;font-size:14px"><strong>Department:</strong> {data.get('department') or '—'}</p>
      <p style="margin:4px 0;font-size:14px"><strong>Visa Type:</strong> {data.get('visa_type') or '—'}</p>
    </div>
    <p style="color:#6b7280;font-size:13px">
      While you wait, explore clubs and internships on
      <a href="https://icom.onrender.com" style="color:#6366f1">icom.onrender.com</a>.
    </p>
    <p style="color:#6b7280;font-size:12px;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:16px">
      ICOM — International Community in Korea<br>
      This is an automated confirmation. Please do not reply to this email.
    </p>
  </div>
</body></html>
"""

    # ── 2. Notification email to admin ───────────────────────────
    admin_body = f"""New Ambassador Application — ICOM

Name:        {applicant_name}
Email:       {applicant_email}
University:  {university}
Department:  {data.get('department', '—')}
Year:        {data.get('year', '—')}
Country:     {data.get('country', '—')}
Visa Type:   {data.get('visa_type', '—')}
KakaoTalk / Social: {data.get('social', '—')}

Motivation:
{data.get('motivation', '—')}

---
Review and approve/reject in the ICOM Admin Panel.
"""

    try:
        # 15s timeout — Render free tier SMTP can hang otherwise
        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            server.starttls()
            server.login(sender_email, sender_password)

            # Send confirmation to applicant
            msg1 = MIMEMultipart("alternative")
            msg1["Subject"] = "✅ ICOM Ambassador Application Received"
            msg1["From"]    = f"ICOM Platform <{sender_email}>"
            msg1["To"]      = applicant_email
            msg1.attach(MIMEText(confirmation_html, "html"))
            server.sendmail(sender_email, applicant_email, msg1.as_string())

            # Send notification to admin
            msg2 = MIMEMultipart()
            msg2["Subject"] = f"[ICOM] New Ambassador Application: {applicant_name} — {university}"
            msg2["From"]    = f"ICOM Platform <{sender_email}>"
            msg2["To"]      = admin_email
            msg2.attach(MIMEText(admin_body, "plain"))
            server.sendmail(sender_email, admin_email, msg2.as_string())

        print(f"[email] Sent confirmation to {applicant_email} and notification to {admin_email}")
        return True

    except smtplib.SMTPAuthenticationError:
        print("[email] Auth failed — check SENDER_EMAIL and SENDER_PASSWORD (use Gmail App Password).")
        return False
    except Exception as e:
        print(f"[email] Failed: {e}")
        return False


# ── Apply ──────────────────────────────────────────────────────────

@ambassador_bp.route("/apply", methods=["POST"])
def apply():
    data = request.get_json(silent=True) or {}

    name       = (data.get("name") or "").strip()
    email      = (data.get("email") or "").strip()
    university = (data.get("university") or "").strip()

    if not name or not email or not university:
        return jsonify({"error": "Name, email, and university are required."}), 400

    # Update existing pending application instead of blocking
    existing = AmbassadorApplication.query.filter_by(email=email, status="pending").first()
    if existing:
        existing.name       = name
        existing.university = university
        existing.department = (data.get("department") or "").strip()
        existing.year       = (data.get("year") or "").strip()
        existing.country    = (data.get("country") or "").strip()
        existing.visa_type  = (data.get("visa_type") or "").strip()
        existing.motivation = (data.get("motivation") or "").strip()
        existing.social     = (data.get("social") or "").strip()
        db.session.commit()
        _send_emails_async(name, email, university, data)
        return jsonify({"message": "Application updated!", "email_sent": True}), 200

    app_record = AmbassadorApplication(
        name       = name,
        email      = email,
        university = university,
        department = (data.get("department") or "").strip(),
        year       = (data.get("year") or "").strip(),
        country    = (data.get("country") or "").strip(),
        visa_type  = (data.get("visa_type") or "").strip(),
        motivation = (data.get("motivation") or "").strip(),
        social     = (data.get("social") or "").strip(),
    )
    db.session.add(app_record)
    db.session.commit()

    # Send emails in background — don't block the response on SMTP
    _send_emails_async(name, email, university, data)

    return jsonify({
        "message": "Application submitted successfully!",
        "email_sent": True,
    }), 201


# ── Admin: list all applications ───────────────────────────────────

@ambassador_bp.route("/applications", methods=["GET"])
@jwt_required()
def list_applications():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    if user.role != "admin":
        return jsonify({"error": "Admin only."}), 403
    apps = AmbassadorApplication.query.order_by(AmbassadorApplication.created_at.desc()).all()
    return jsonify({"applications": [a.to_dict() for a in apps]}), 200


# ── Admin: approve / reject ────────────────────────────────────────

@ambassador_bp.route("/applications/<int:app_id>", methods=["PATCH"])
@jwt_required()
def update_application(app_id):
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    if user.role != "admin":
        return jsonify({"error": "Admin only."}), 403

    app_record = AmbassadorApplication.query.get_or_404(app_id)
    data   = request.get_json(silent=True) or {}
    status = data.get("status")

    if status in ("approved", "rejected", "pending"):
        app_record.status = status
        db.session.commit()

        # Notify applicant of decision
        sender_email    = os.environ.get("SENDER_EMAIL", "").strip()
        sender_password = os.environ.get("SENDER_PASSWORD", "").strip()
        if sender_email and sender_password and app_record.email:
            try:
                if status == "approved":
                    subject = "🎉 You're now an ICOM Ambassador!"
                    body    = f"""Hi {app_record.name},

Congratulations! Your application to become an ICOM Ambassador for {app_record.university} has been APPROVED.

You now have access to post News on behalf of your university on the ICOM platform.

Welcome to the team! 🚀

— The ICOM Team
"""
                else:
                    subject = "ICOM Ambassador Application Update"
                    body    = f"""Hi {app_record.name},

Thank you for your interest in becoming an ICOM Ambassador.

Unfortunately, we were unable to approve your application at this time. You're welcome to apply again in the future.

— The ICOM Team
"""
                smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
                smtp_port = int(os.environ.get("SMTP_PORT", "587"))

                # Send in background thread so admin action returns immediately
                def _notify():
                    try:
                        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
                            server.starttls()
                            server.login(sender_email, sender_password)
                            msg = MIMEMultipart()
                            msg["Subject"] = subject
                            msg["From"]    = f"ICOM Platform <{sender_email}>"
                            msg["To"]      = app_record.email
                            msg.attach(MIMEText(body, "plain"))
                            server.sendmail(sender_email, app_record.email, msg.as_string())
                    except Exception as e:
                        print(f"[email] Decision notification failed: {e}")
                threading.Thread(target=_notify, daemon=True).start()
            except Exception as e:
                print(f"[email] Decision notification failed: {e}")

    return jsonify({"application": app_record.to_dict()}), 200
