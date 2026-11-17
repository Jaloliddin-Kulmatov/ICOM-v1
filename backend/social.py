"""Daily opportunities post for social media.

Every morning ICOM collects opportunities that went live recently and have not
been posted yet, writes one digest, and sends it to the ICOM Telegram channel.
Links go to ICOM with ?ref=telegram so the admin panel shows the sign-ups it
brings. Each posting goes out once (jobs.posted_at).

Settings (Render environment):
  TELEGRAM_BOT_TOKEN   from @BotFather; the bot must be an admin of the channel
  TELEGRAM_CHANNEL_ID  "@yourchannel" or the channel's numeric id
"""
import html
import os
from datetime import datetime, timedelta

import requests

from app import db
from job_lifecycle import is_listed, kst_today
from models import Job, SocialPost

SITE = os.environ.get("FRONTEND_URL", "https://icom.ai.kr").rstrip("/")
MAX_ITEMS = 8
FRESH_DAYS = 3          # only postings that went live in the last few days
TELEGRAM_LIMIT = 4096   # characters per message

# Scholarships and the rarer kinds first: they are what students miss most.
KINDS = {
    "scholarship": ("🎓", "Scholarship"),
    "contest": ("🏆", "Contest"),
    "program": ("🚀", "Program"),
    "part-time": ("☕", "Part-time"),
    "internship": ("💼", "Internship"),
}
ORDER = list(KINDS)


def _kind(job: Job) -> str:
    return job.job_type if job.job_type in KINDS else "internship"


def telegram_configured() -> bool:
    return bool(os.environ.get("TELEGRAM_BOT_TOKEN") and os.environ.get("TELEGRAM_CHANNEL_ID"))


def pick_items(now: datetime | None = None) -> list:
    now = now or datetime.utcnow()
    rows = (Job.query.filter(Job.is_active.is_(True), Job.posted_at.is_(None),
                             Job.created_at > now - timedelta(days=FRESH_DAYS))
            .order_by(Job.created_at.desc()).limit(200).all())
    rows = [j for j in rows if is_listed(j)]
    rows.sort(key=lambda j: (ORDER.index(_kind(j)), j.foreigner_friendly != "yes", -j.created_at.timestamp()))
    return rows[:MAX_ITEMS]


def _deadline(job: Job) -> str:
    raw = (job.deadline or "").strip()[:10]
    try:
        days = (datetime.fromisoformat(raw).date() - kst_today()).days
    except ValueError:
        return ""
    return "⏳ closes today" if days <= 0 else "⏳ 1 day left" if days == 1 else f"⏳ {days} days left"


def build_text(items: list, ref: str = "telegram") -> str:
    e = html.escape
    parts = ["🇰🇷 <b>New opportunities for international students in Korea</b>",
             "Yangi imkoniyatlar · Новые возможности · 새 기회", ""]
    for j in items:
        icon, label = KINDS[_kind(j)]
        facts = " · ".join(x for x in (e(j.company or ""), e(j.salary or ""), _deadline(j)) if x)
        parts += [f"{icon} <b>{label}</b> · {e(j.title)}", facts, f"👉 {SITE}/internships/{j.id}?ref={ref}", ""]
    parts.append(f"All opportunities: {SITE}/opportunities?ref={ref}")
    text = "\n".join(parts)
    return text if len(text) <= TELEGRAM_LIMIT else text[:TELEGRAM_LIMIT - 1] + "…"


def send_telegram(text: str) -> None:
    token, chat = os.environ["TELEGRAM_BOT_TOKEN"], os.environ["TELEGRAM_CHANNEL_ID"]
    r = requests.post(f"https://api.telegram.org/bot{token}/sendMessage", timeout=20, data={
        "chat_id": chat, "text": text, "parse_mode": "HTML", "disable_web_page_preview": "true"})
    body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    if r.status_code != 200 or not body.get("ok"):
        raise RuntimeError(body.get("description") or f"Telegram answered {r.status_code}")


def posted_today() -> bool:
    start = datetime.utcnow() - timedelta(hours=20)
    return SocialPost.query.filter(SocialPost.platform == "telegram", SocialPost.status == "posted",
                                   SocialPost.created_at > start).first() is not None


def run(force: bool = False) -> dict:
    """Post today's digest. Without force it posts at most once a day."""
    if not telegram_configured():
        return {"status": "not_configured"}
    if not force and posted_today():
        return {"status": "already_posted"}
    items = pick_items()
    if not items:
        return {"status": "nothing_new"}
    text = build_text(items)
    post = SocialPost(platform="telegram", text=text, job_ids=[j.id for j in items], status="posted")
    try:
        send_telegram(text)
    except Exception as e:   # keep the items for tomorrow and show the error to admins
        post.status, post.error = "failed", str(e)[:300]
    else:
        now = datetime.utcnow()
        for j in items:
            j.posted_at = now
    db.session.add(post)
    db.session.commit()
    return {"status": post.status, "items": len(items), "error": post.error or ""}


def run_scheduled(flask_app) -> None:
    with flask_app.app_context():
        try:
            print(f"[social] {run()}")
        except Exception as e:
            db.session.rollback()
            print(f"[social] failed: {e}")
