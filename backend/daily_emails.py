"""Daily emails: new internships matching a student's saved search, and
reminders before their visa expires. Runs once a day from the scheduler.

Sending uses routes.ambassador._send_email (Resend, or Gmail SMTP). When no
email service is configured nothing is sent and nothing is marked as sent.
"""
import html as _html
import os
from datetime import datetime, timedelta, timezone

from app import db
from models import Job, User
from job_insights import job_city, job_field
from job_lifecycle import is_listed

KST = timezone(timedelta(hours=9))
VISA_REMINDER_DAYS = (90, 60, 30, 7)
MAX_JOBS_PER_EMAIL = 10


def _site() -> str:
    raw = os.environ.get("FRONTEND_URL", "https://icom.ai.kr").split(",")[0].strip()
    return raw.rstrip("/") or "https://icom.ai.kr"


def _send(to, subject, html, text) -> bool:
    from routes.ambassador import _send_email
    return _send_email(to, subject, html, text)


def matching_jobs(user: User, since: datetime) -> list:
    rows = (Job.query.filter(Job.is_active.is_(True), Job.created_at > since)
            .order_by(Job.created_at.desc()).limit(300).all())
    out = []
    for j in rows:
        if not is_listed(j):
            continue
        if user.alert_field and job_field(j.title, j.description, j.tags) != user.alert_field:
            continue
        if user.alert_city and job_city(j.location) != user.alert_city:
            continue
        out.append(j)
    return out


def send_job_alerts(now: datetime | None = None) -> dict:
    now = now or datetime.utcnow()
    sent = skipped = 0
    for user in User.query.filter(User.job_alerts_enabled.is_(True)).all():
        if not (user.email or "").strip():
            continue
        since = user.alert_last_sent or (now - timedelta(days=1))
        jobs = matching_jobs(user, since)
        if not jobs:
            user.alert_last_sent = now
            continue
        site = _site()
        items = "".join(
            f'<li style="margin:0 0 10px"><a href="{site}/internships/{j.id}">{_html.escape(j.title)}</a>'
            f'<br><span style="color:#5c6b80">{_html.escape(j.company)} · {_html.escape(j.location or "Korea")}</span></li>'
            for j in jobs[:MAX_JOBS_PER_EMAIL])
        more = len(jobs) - MAX_JOBS_PER_EMAIL
        what = " · ".join(filter(None, [user.alert_field, user.alert_city])) or "all fields, all of Korea"
        html = (f'<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">'
                f'<h2 style="color:#16213a">{len(jobs)} new internship{"s" if len(jobs) != 1 else ""} for you</h2>'
                f'<p style="color:#5c6b80">Your alert: {_html.escape(what)}</p><ul style="padding-left:18px">{items}</ul>'
                + (f'<p><a href="{site}/internships">See {more} more on ICOM</a></p>' if more > 0 else "")
                + f'<p style="font-size:12px;color:#5c6b80">Change or stop alerts on the Internships page.</p></div>')
        text = "\n".join(f"- {j.title} ({j.company}): {site}/internships/{j.id}" for j in jobs[:MAX_JOBS_PER_EMAIL])
        if _send(user.email, f"ICOM: {len(jobs)} new internship{'s' if len(jobs) != 1 else ''} for you", html, text):
            user.alert_last_sent = now
            sent += 1
        else:
            skipped += 1
    db.session.commit()
    return {"alerts_sent": sent, "alerts_not_sent": skipped}


def visa_reminder_due(user: User, today) -> int | None:
    """The reminder (days before expiry) to send today, or None."""
    from datetime import date
    try:
        expiry = date.fromisoformat((user.visa_expiry or "")[:10])
    except ValueError:
        return None
    days_left = (expiry - today).days
    if days_left < 0:
        return None
    due = min((d for d in VISA_REMINDER_DAYS if days_left <= d), default=None)
    if due is None:
        return None
    last = user.visa_reminder_sent or ""
    if last.startswith(f"{user.visa_expiry}:") and int(last.split(":")[1]) <= due:
        return None   # this reminder (or a later one) already went out
    return due


def send_visa_reminders(today=None) -> dict:
    today = today or datetime.now(KST).date()
    sent = 0
    users = User.query.filter(User.visa_expiry.isnot(None), User.visa_expiry != "").all()
    for user in users:
        due = visa_reminder_due(user, today)
        if due is None or not (user.email or "").strip():
            continue
        from datetime import date
        days_left = (date.fromisoformat(user.visa_expiry[:10]) - today).days
        visa = user.visa_type or "visa"
        site = _site()
        html = (f'<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">'
                f'<h2 style="color:#16213a">Your {_html.escape(visa)} expires in {days_left} days</h2>'
                f'<p>Expiry date: <b>{user.visa_expiry}</b>. Apply to extend it at least 4 weeks before it expires, '
                f'online at HiKorea (hikorea.go.kr) or at your local immigration office (출입국·외국인청). '
                f'Ask your international office early which documents you need.</p>'
                f'<p><a href="{site}/guide/visa">Read the ICOM visa guide</a></p>'
                f'<p style="font-size:12px;color:#5c6b80">You get this because you added your visa expiry date to your ICOM profile. '
                f'Remove the date there to stop these reminders.</p></div>')
        text = (f"Your {visa} expires in {days_left} days ({user.visa_expiry}). "
                f"Apply to extend it at least 4 weeks before expiry on HiKorea or at your immigration office. "
                f"Guide: {site}/guide/visa")
        if _send(user.email, f"Your visa expires in {days_left} days", html, text):
            user.visa_reminder_sent = f"{user.visa_expiry}:{due}"
            sent += 1
    db.session.commit()
    return {"visa_reminders_sent": sent}


def run(flask_app):
    with flask_app.app_context():
        try:
            result = send_job_alerts()
            result.update(send_visa_reminders())
            print(f"[daily-emails] {result}")
        except Exception as e:
            db.session.rollback()
            print(f"[daily-emails] failed: {e}")
