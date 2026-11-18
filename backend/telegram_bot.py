"""The ICOM Telegram bot: send it a link, it adds the opportunity to ICOM and posts it.

An admin sends the bot a link to an internship, scholarship, contest or program
page. ICOM reads the page, the AI fills in title, organizer, deadline, amount and
who can apply, the opportunity goes live on ICOM, and it is posted to the channel
or group as a spotlight (picture + details + Apply button). The bot replies with
what it did.

Only Telegram accounts listed in TELEGRAM_ADMIN_IDS can add things; anyone else
is pointed to the share form on the website. Send /start to the bot to see your
Telegram id. Telegram reaches us through a webhook (admin panel: "Turn on the bot").
"""
import hashlib
import html
import ipaddress
import os
import re
import socket
import threading
from datetime import datetime
from urllib.parse import urlparse

import requests

import opportunity_import as imp
import social
from app import db
from models import Job, SocialPost

MAX_LINKS = 3


def webhook_secret() -> str:
    """Telegram sends this back with every update, so only Telegram can call the webhook."""
    return hashlib.sha256(("icom-webhook:" + os.environ.get("TELEGRAM_BOT_TOKEN", "")).encode()).hexdigest()[:48]


def admin_ids() -> set:
    return {int(x) for x in re.findall(r"\d+", os.environ.get("TELEGRAM_ADMIN_IDS", ""))}


def set_webhook() -> dict:
    api = os.environ.get("PUBLIC_API_URL", "https://icom-v1.onrender.com/api").rstrip("/")
    return social.telegram_api("setWebhook", url=f"{api}/admin/telegram/webhook", secret_token=webhook_secret(),
                               allowed_updates=["message"], drop_pending_updates="true")


def reply(chat_id, text: str) -> None:
    try:
        social.telegram_api("sendMessage", chat_id=chat_id, text=text, parse_mode="HTML",
                            disable_web_page_preview="true")
    except Exception as e:   # a failed reply must never break the webhook
        print(f"[bot] reply failed: {e}")


# ── Reading a link ───────────────────────────────────────────────────────────

def _public_url(url: str) -> bool:
    """Only http(s) pages on the public internet (never the server's own network)."""
    p = urlparse(url)
    if p.scheme not in ("http", "https") or not p.hostname:
        return False
    try:
        for info in socket.getaddrinfo(p.hostname, None):
            ip = ipaddress.ip_address(info[4][0])
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
                return False
    except (socket.gaierror, ValueError):
        return False
    return True


def _meta(page: str, *names) -> str:
    for n in names:
        m = (re.search(rf'<meta[^>]+(?:property|name)="{n}"[^>]+content="([^"]*)"', page, re.I)
             or re.search(rf'<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="{n}"', page, re.I))
        if m and m.group(1).strip():
            return imp._text(m.group(1))
    return ""


def read_page(url: str) -> dict:
    r = requests.get(url, timeout=25, headers={"User-Agent": imp.UA}, allow_redirects=True)
    r.raise_for_status()
    r.encoding = r.apparent_encoding or r.encoding
    page = r.text
    title = _meta(page, "og:title", "twitter:title")
    if not title:
        m = re.search(r"<title[^>]*>(.*?)</title>", page, re.S | re.I)
        title = imp._text(m.group(1)) if m else ""
    desc = _meta(page, "og:description", "description")
    body = re.search(r"<body[^>]*>(.*)</body>", page, re.S | re.I)
    text = imp._text(body.group(1) if body else page)
    return {"source": urlparse(url).hostname or "the web", "source_url": url, "title": title[:200],
            "organizer": _meta(page, "og:site_name"), "deadline": "", "amount": "", "eligibility": "",
            "apply_link": url, "text": f"{desc}\n\n{text}"[:4000], "kind_hint": ""}


def add_from_link(url: str):
    """Read the page and put the opportunity live on ICOM. Returns (job, was_new)."""
    existing = Job.query.filter(db.or_(Job.source_url == url, Job.apply_link == url),
                                Job.job_type != "skipped").first()
    if existing:
        if not existing.is_active:      # waiting in the review queue: an admin sending it means approve
            existing.is_active, existing.review_status = True, "approved"
            existing.checked_at, existing.closed_at = datetime.utcnow(), None
            db.session.commit()
        return existing, False
    cand = read_page(url)
    info = {}
    from routes.ai import _get_client
    client = _get_client()
    if client is not None:
        try:
            info = imp.enrich(client, cand) or {}
        except Exception as e:
            print(f"[bot] AI failed for {url}: {e}")
    if not (info.get("title") or cand["title"]):
        raise ValueError("I couldn't read that page. It may need a login or only work in a browser app.")
    job = imp._save(cand, info)          # an admin sent it, so it goes live straight away
    job.is_active, job.review_status, job.checked_at = True, "approved", datetime.utcnow()
    job.tags = job.tags.replace(f"via {cand['source']}", "via Telegram bot")
    db.session.commit()
    return job, True


def post(job: Job) -> str:
    """Post one opportunity to the channel as a spotlight; returns an error note or ""."""
    note = social.post_telegram([job], "spotlight")
    job.posted_at = datetime.utcnow()
    db.session.add(SocialPost(platform="telegram", text=social.spotlight_caption(job), job_ids=[job.id],
                              status="posted", error=note[:300] or None))
    db.session.commit()
    return note


# ── Messages ─────────────────────────────────────────────────────────────────

HELP = ("👋 This is the ICOM bot.\n\n"
        "Admins: send me a link to an internship, scholarship, contest or program page. "
        "I'll add it to ICOM and post it to the channel.\n\n"
        "Students: share opportunities at https://icom.ai.kr/internships/share")


def handle_update(update: dict) -> None:
    msg = update.get("message") or {}
    chat_id = (msg.get("chat") or {}).get("id")
    user_id = (msg.get("from") or {}).get("id")
    text = (msg.get("text") or msg.get("caption") or "").strip()
    if not chat_id or not text:
        return
    if text.startswith(("/start", "/help")):
        reply(chat_id, f"{HELP}\n\nYour Telegram id: <code>{user_id}</code>")
        return
    urls = list(dict.fromkeys(re.findall(r"https?://[^\s<>\"]+", text)))[:MAX_LINKS]
    if not urls:
        reply(chat_id, HELP)
        return
    if user_id not in admin_ids():
        reply(chat_id, "Only ICOM admins can add posts here. You can share it at https://icom.ai.kr/internships/share "
                       f"and an admin will check it.\n\n(Your Telegram id: <code>{user_id}</code>)")
        return
    for url in urls:
        if not _public_url(url):
            reply(chat_id, f"⚠️ I can't open that link: {url}")
            continue
        reply(chat_id, "⏳ Reading the page…")
        try:
            job, new = add_from_link(url)
            note = post(job)
            first = "✅ Added to ICOM and posted" if new else "✅ Already on ICOM, posted again"
            reply(chat_id, f"{first}: <b>{html.escape(job.title)}</b>\n"
                           f"{social.link(job, 'telegram')}" + (f"\n\n⚠️ {html.escape(note)}" if note else ""))
        except Exception as e:
            db.session.rollback()
            reply(chat_id, f"⚠️ Couldn't add {url}\n{html.escape(str(e)[:200])}")


def handle_update_async(flask_app, update: dict) -> None:
    """Answer Telegram at once; read pages and post in the background (pages can be slow)."""
    def work():
        with flask_app.app_context():
            try:
                handle_update(update)
            except Exception as e:
                db.session.rollback()
                print(f"[bot] update failed: {e}")
    if flask_app.config.get("TESTING"):
        work()
    else:
        threading.Thread(target=work, daemon=True, name="telegram-update").start()
