"""The ICOM Telegram bot: run ICOM's opportunities from Telegram.

Admins send the bot a link. ICOM reads the page and the AI fills in the details;
the bot shows its analysis (kind, title, organizer, deadline, amount, who can
apply, whether it's open to international students in Korea) with buttons:
Publish + post, Publish only, Edit, Cancel. Edit offers a button per field and
waits for the new value. Changing something already posted also updates the
channel post's caption.

Commands: /list /show /edit /hide /repost /pending /post /import /stats,
and for owners /admins /addadmin /removeadmin.

Who can do what:
  owners  TELEGRAM_ADMIN_IDS on Render: everything, including adding admins
  admins  added by an owner with /addadmin: everything except managing admins
  others  told to share on the website; /start shows anyone their Telegram id
Telegram reaches us through a webhook (admin panel: "Turn on the bot").
"""
import hashlib
import html
import ipaddress
import os
import re
import socket
import threading
from datetime import date, datetime, timedelta
from urllib.parse import urlparse

import requests

import opportunity_import as imp
import social
from app import db
from models import BotAdmin, BotState, Job, SocialPost, User

MAX_LINKS = 20         # links checked from one message (a whole saved list)
e = html.escape

# Fields an admin can change: name shown on the button, Job attribute.
FIELDS = {
    "title": ("Title", "title"), "org": ("Organizer", "company"), "kind": ("Type", "job_type"),
    "deadline": ("Deadline", "deadline"), "amount": ("Amount / prize", "salary"),
    "who": ("Who can apply", None), "place": ("Place", "location"), "link": ("Apply link", "apply_link"),
    "summary": ("Summary", None),
}
KIND_CHOICES = ("internship", "part-time", "scholarship", "contest", "program")


# ── Setup and permissions ────────────────────────────────────────────────────

def webhook_secret() -> str:
    """Telegram sends this back with every update, so only Telegram can call the webhook."""
    return hashlib.sha256(("icom-webhook:" + os.environ.get("TELEGRAM_BOT_TOKEN", "")).encode()).hexdigest()[:48]


def owner_ids() -> set:
    return {int(x) for x in re.findall(r"\d+", os.environ.get("TELEGRAM_ADMIN_IDS", ""))}


def admin_ids() -> set:
    return owner_ids() | {a.telegram_id for a in BotAdmin.query.all()}


def set_webhook() -> dict:
    api = os.environ.get("PUBLIC_API_URL", "https://icom-v1.onrender.com/api").rstrip("/")
    social.telegram_api("setMyCommands", commands=[
        {"command": c, "description": d} for c, d in (
            ("list", "Latest opportunities"), ("pending", "Waiting for review"), ("show", "Show one: /show 42"),
            ("edit", "Change a field: /edit 42 deadline 2026-12-31"), ("post", "Post today's digest now"),
            ("import", "Look for new ones on other sites"), ("stats", "ICOM numbers"), ("admins", "Who can use the bot"),
            ("help", "What I can do"))])
    return social.telegram_api("setWebhook", url=f"{api}/admin/telegram/webhook", secret_token=webhook_secret(),
                               allowed_updates=["message", "callback_query"], drop_pending_updates="true")


def send(chat_id, text: str, buttons=None) -> dict:
    data = {"chat_id": chat_id, "text": text[:4096], "parse_mode": "HTML", "disable_web_page_preview": "true"}
    if buttons:
        data["reply_markup"] = {"inline_keyboard": buttons}
    try:
        return social.telegram_api("sendMessage", **data)
    except Exception as err:   # a failed reply must never break the webhook
        print(f"[bot] reply failed: {err}")
        return {}


def _bust_cache():
    from routes.admin import _cache_bust
    _cache_bust("jobs_list")


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


def analyze(url: str):
    """Read the page into a draft (not live yet). Returns (job, relevant, was_new, ai_ok)."""
    existing = Job.query.filter(db.or_(Job.source_url == url, Job.apply_link == url),
                                Job.job_type != "skipped").first()
    if existing:
        return existing, True, False, True
    cand = read_page(url)
    info = {}
    from routes.ai import _get_client
    client = _get_client()
    if client is not None:
        try:
            info = imp.enrich_with_retry(client, cand) or {}
        except Exception as err:
            print(f"[bot] AI failed for {url}: {err}")
    if not (info.get("title") or cand["title"]):
        raise ValueError("I couldn't read that page. It may need a login or only work in an app.")
    job = imp._save(cand, info)
    job.review_status = "draft"          # stays hidden until an admin presses Publish
    job.tags = job.tags.replace(f"via {cand['source']}", "via Telegram bot")
    db.session.commit()
    return job, bool(info.get("relevant", True)), True, bool(info)


# ── Showing and changing an opportunity ──────────────────────────────────────

def _who(job: Job) -> str:
    return social._who(job)


def _summary(job: Job) -> str:
    first = (job.description or "").split("\n\n")[0].strip()
    return "" if first.startswith(("Who can apply:", "Found on", "Schedule:")) else first


def status_of(job: Job) -> str:
    if job.review_status == "draft":
        return "📝 Draft (not on ICOM yet)"
    if job.review_status == "pending":
        return "⏳ Waiting for review"
    if not job.is_active:
        return "🙈 Hidden"
    return "✅ Live on ICOM" + (" · posted" if job.posted_at else "")


def card_text(job: Job, relevant: bool = True, ai_ok: bool = True) -> str:
    icon, label = social.KINDS[social._kind(job)]
    rows = [f"{icon} <b>{e(job.title)}</b>  <i>#{job.id}</i>", status_of(job), "",
            f"Type: {label}", f"Organizer: {e(job.company or '—')}",
            f"Deadline: {e(job.deadline or '—')}" + (f" ({social.days_left(job)})" if social.days_left(job) else ""),
            f"Amount / prize: {e(job.salary or '—')}", f"Who can apply: {e(_who(job) or '—')}",
            f"Place: {e(job.location or '—')}", f"Apply link: {e(job.apply_link or '—')}"]
    if _summary(job):
        rows += ["", e(_summary(job))[:500]]
    if not ai_ok:
        rows += ["", "⚠️ The AI couldn't check this page, so only its title was read. Fix the details with ✏️ Edit before publishing."]
    elif not relevant:
        rows += ["", "⚠️ The AI thinks international students in Korea can't apply, or it isn't in Korea. Check before publishing."]
    return "\n".join(rows)


def buttons_for(job: Job) -> list:
    i = job.id
    if job.review_status in ("draft", "pending") or not job.is_active:
        return [[{"text": "✅ Publish + post", "callback_data": f"pub:{i}"},
                 {"text": "📥 Publish only", "callback_data": f"pubq:{i}"}],
                [{"text": "✏️ Edit", "callback_data": f"edit:{i}"},
                 {"text": "🗑 Cancel" if job.review_status == "draft" else "🗑 Reject", "callback_data": f"del:{i}"}]]
    return [[{"text": "📣 Post again", "callback_data": f"repost:{i}"}, {"text": "✏️ Edit", "callback_data": f"edit:{i}"}],
            [{"text": "🙈 Hide from ICOM", "callback_data": f"hide:{i}"},
             {"text": "🔗 Open on ICOM", "url": social.link(job, "telegram")}]]


def field_buttons(job: Job) -> list:
    keys = list(FIELDS)
    rows = [[{"text": FIELDS[k][0], "callback_data": f"ef:{job.id}:{k}"} for k in keys[n:n + 3]] for n in range(0, len(keys), 3)]
    return rows + [[{"text": "⬅️ Back", "callback_data": f"show:{job.id}"}]]


def set_field(job: Job, key: str, value: str) -> None:
    """Validate and save one field. Raises ValueError with a message the admin can act on."""
    value = value.strip()
    if key == "deadline":
        if value.lower() in ("none", "-", "no", "rolling"):
            value = ""
        else:
            try:
                value = date.fromisoformat(value).isoformat()
            except ValueError:
                raise ValueError("Send the date like 2026-12-31, or 'none'.")
    elif key == "link" and not value.startswith(("http://", "https://")):
        raise ValueError("Send a full link starting with https://")
    elif key == "kind" and value not in KIND_CHOICES:
        raise ValueError("Type must be one of: " + ", ".join(KIND_CHOICES))
    elif key == "title" and not value:
        raise ValueError("The title can't be empty.")
    if key in ("who", "summary"):
        parts = [p for p in (job.description or "").split("\n\n") if p.strip()]
        if key == "who":
            parts = [p for p in parts if not p.startswith("Who can apply:")]
            if value:
                parts.insert(1 if _summary(job) else 0, f"Who can apply: {value[:200]}")
        else:
            if _summary(job):
                parts = parts[1:]
            if value:
                parts.insert(0, value[:600])
        job.description = "\n\n".join(parts)
    else:
        limit = {"title": 200, "org": 150, "amount": 100, "place": 150, "link": 500}.get(key, 50)
        setattr(job, FIELDS[key][1], value[:limit])
    db.session.commit()
    _bust_cache()
    _update_channel_post(job)


def _update_channel_post(job: Job) -> None:
    """If this opportunity's spotlight is in the channel, change its caption to match."""
    post = (SocialPost.query.filter(SocialPost.platform == "telegram", SocialPost.message_id.isnot(None))
            .order_by(SocialPost.id.desc()).all())
    post = next((p for p in post if p.job_ids == [job.id]), None)
    if not post:
        return
    try:
        social.telegram_api("editMessageCaption", chat_id=os.environ["TELEGRAM_CHANNEL_ID"], message_id=post.message_id,
                            caption=social.spotlight_caption(job), parse_mode="HTML",
                            reply_markup=social.apply_button(job))
    except Exception as err:   # e.g. "message is not modified"
        print(f"[bot] caption edit skipped: {err}")


def publish(job: Job, post_it: bool) -> str:
    job.is_active, job.review_status = True, "approved"
    job.checked_at, job.closed_at = datetime.utcnow(), None
    db.session.commit()
    _bust_cache()
    return repost(job) if post_it else ""


def repost(job: Job) -> str:
    """Post one opportunity to the channel as a spotlight; returns a problem note or ""."""
    note, message_id = "", ""
    try:
        message_id = social.send_spotlight(job)
    except RuntimeError as err:
        social.send_telegram(social.build_text([job]))
        note = f"picture post failed ({err}); sent as text"
    job.posted_at = datetime.utcnow()
    db.session.add(SocialPost(platform="telegram", text=social.spotlight_caption(job), job_ids=[job.id],
                              status="posted", error=note[:300] or None, message_id=message_id or None))
    db.session.commit()
    return note


# ── Commands ─────────────────────────────────────────────────────────────────

HELP_ADMIN = ("🛠 <b>ICOM bot</b>\n\n"
              "Send me a <b>link</b> to an internship, scholarship, contest or program. I'll check it and show you "
              "what I found, then you choose: publish + post, publish only, edit, or cancel.\n\n"
              "/list – latest opportunities\n/pending – waiting for review (website shares and imports)\n"
              "/show 42 – one opportunity with buttons\n/edit 42 deadline 2026-12-31 – change a field\n"
              "   fields: " + ", ".join(FIELDS) + "\n"
              "/hide 42 · /repost 42\n/post – post today's digest now\n/import – look for new ones on other sites\n"
              "/stats – ICOM numbers")
HELP_OWNER = "\n\n<b>Owner</b>\n/admins – who can use me\n/addadmin 123456789 Name\n/removeadmin 123456789"
HELP_OTHER = ("👋 This is the ICOM bot.\n\nStudents: share internships, scholarships and contests at "
              "https://icom.ai.kr/internships/share and the ICOM team will post them.")


def _job(arg: str):
    return db.session.get(Job, int(arg)) if arg and arg.isdigit() else None


def command(chat_id, user_id, text: str) -> None:
    parts = text.split(maxsplit=3)
    cmd = parts[0].split("@")[0].lower()
    args = parts[1:]
    owner = user_id in owner_ids()

    if cmd in ("/start", "/help"):
        send(chat_id, HELP_ADMIN + (HELP_OWNER if owner else "") + f"\n\nYour Telegram id: <code>{user_id}</code>")
    elif cmd == "/list":
        rows = (Job.query.filter(Job.job_type != "skipped", Job.review_status != "rejected")
                .order_by(Job.id.desc()).limit(10).all())
        lines = [f"<code>#{j.id}</code> {social.KINDS[social._kind(j)][0]} {e(j.title[:60])} · {status_of(j)}" for j in rows]
        send(chat_id, "<b>Latest opportunities</b>\n\n" + ("\n".join(lines) or "Nothing yet.") + "\n\nOpen one: /show 42")
    elif cmd == "/pending":
        rows = Job.query.filter(Job.review_status.in_(("pending", "draft"))).order_by(Job.id.asc()).limit(5).all()
        if not rows:
            send(chat_id, "Nothing is waiting for review. 🎉")
        for j in rows:
            send(chat_id, card_text(j), buttons_for(j))
    elif cmd in ("/show", "/hide", "/repost"):
        job = _job(args[0] if args else "")
        if not job:
            send(chat_id, f"Which one? For example: {cmd} 42  (numbers are in /list)")
        elif cmd == "/show":
            send(chat_id, card_text(job), buttons_for(job))
        elif cmd == "/hide":
            hide(job)
            send(chat_id, f"🙈 Hidden from ICOM: {e(job.title)}", buttons_for(job))
        else:
            note = repost(job)
            send(chat_id, f"📣 Posted: {e(job.title)}" + (f"\n⚠️ {e(note)}" if note else ""))
    elif cmd == "/edit":
        job = _job(args[0] if args else "")
        if not job:
            send(chat_id, "Example: /edit 42 deadline 2026-12-31\nFields: " + ", ".join(FIELDS))
        elif len(args) < 3 or args[1] not in FIELDS:
            send(chat_id, f"What should I change on #{job.id}?", field_buttons(job))
        else:
            try:
                set_field(job, args[1], args[2])
                send(chat_id, "✅ Saved.\n\n" + card_text(job), buttons_for(job))
            except ValueError as err:
                send(chat_id, f"⚠️ {e(str(err))}")
    elif cmd == "/post":
        r = social.run(force=True)
        send(chat_id, {"posted": f"📣 Posted {r.get('items')} opportunities ({r.get('style')}).",
                       "nothing_new": "Nothing new to post right now."}.get(r["status"], f"Result: {e(str(r))}"))
    elif cmd == "/import":
        send(chat_id, "🔎 Looking on Scholarships Corner and Wevity… (about a minute)")
        r = imp.run()
        send(chat_id, f"Found {r.get('added', 0)} new. See them with /pending." if r.get("status") == "done"
             else e(r.get("message") or str(r)))
    elif cmd == "/stats":
        week = datetime.utcnow() - timedelta(days=7)
        from job_lifecycle import is_listed
        live = [j for j in Job.query.filter_by(is_active=True).all() if is_listed(j)]
        counts = {}
        for j in live:
            counts[social._kind(j)] = counts.get(social._kind(j), 0) + 1
        send(chat_id, "<b>ICOM now</b>\n" + "\n".join(f"{social.KINDS[k][0]} {social.KINDS[k][1]}: {n}" for k, n in counts.items())
             + f"\n\n⏳ Waiting for review: {Job.query.filter(Job.review_status.in_(('pending', 'draft'))).count()}"
             + f"\n👥 Members: {User.query.count()} (+{User.query.filter(User.created_at >= week).count()} this week)")
    elif cmd == "/admins":
        extra = BotAdmin.query.order_by(BotAdmin.created_at).all()
        lines = [f"👑 <code>{i}</code> (owner)" for i in sorted(owner_ids())]
        lines += [f"🛠 <code>{a.telegram_id}</code> {e(a.name or '')}" for a in extra]
        send(chat_id, "<b>Who can use the bot</b>\n" + "\n".join(lines)
             + ("\n\nAdd: /addadmin 123456789 Name\nRemove: /removeadmin 123456789" if owner else ""))
    elif cmd in ("/addadmin", "/removeadmin"):
        if not owner:
            send(chat_id, "Only the owner can change admins.")
        elif not args or not args[0].isdigit():
            send(chat_id, f"Example: {cmd} 123456789" + (" Aziz" if cmd == "/addadmin" else "")
                 + "\nThey can see their id by sending /start to me.")
        elif cmd == "/addadmin":
            tid = int(args[0])
            row = db.session.get(BotAdmin, tid) or BotAdmin(telegram_id=tid, added_by=user_id)
            row.name = " ".join(args[1:])[:80] or row.name
            db.session.add(row)
            db.session.commit()
            send(chat_id, f"✅ <code>{tid}</code> {e(row.name or '')} can now use the bot.")
            send(tid, "👋 You're now an ICOM bot admin. Send /help to see what you can do.")
        else:
            row = db.session.get(BotAdmin, int(args[0]))
            if row:
                db.session.delete(row)
                db.session.commit()
            send(chat_id, "Removed." if row else "That id isn't an admin (owners are set on Render).")
    else:
        send(chat_id, "I don't know that command. /help shows what I can do.")


def hide(job: Job) -> None:
    job.is_active = False
    db.session.commit()
    _bust_cache()


# ── Buttons ──────────────────────────────────────────────────────────────────

def button(cq: dict) -> None:
    chat_id = ((cq.get("message") or {}).get("chat") or {}).get("id")
    message_id = (cq.get("message") or {}).get("message_id")
    data = cq.get("data") or ""
    try:
        social.telegram_api("answerCallbackQuery", callback_query_id=cq.get("id"))
    except Exception:
        pass
    if (cq.get("from") or {}).get("id") not in admin_ids():
        send(chat_id, "Only ICOM admins can use these buttons.")
        return
    action, _, rest = data.partition(":")
    job_id, _, extra = rest.partition(":")
    job = _job(job_id)
    if not job:
        send(chat_id, "That opportunity no longer exists.")
        return

    def update(text, buttons=None):
        try:
            social.telegram_api("editMessageText", chat_id=chat_id, message_id=message_id, text=text[:4096],
                                parse_mode="HTML", disable_web_page_preview="true",
                                reply_markup={"inline_keyboard": buttons or []})
        except Exception:
            send(chat_id, text, buttons)

    if action in ("pub", "pubq"):
        note = publish(job, post_it=action == "pub")
        update(("✅ Published and posted" if action == "pub" else "✅ Published (not posted)")
               + (f"\n⚠️ {e(note)}" if note else "") + "\n\n" + card_text(job), buttons_for(job))
    elif action == "repost":
        note = repost(job)
        update("📣 Posted again" + (f"\n⚠️ {e(note)}" if note else "") + "\n\n" + card_text(job), buttons_for(job))
    elif action == "hide":
        hide(job)
        update("🙈 Hidden from ICOM\n\n" + card_text(job), buttons_for(job))
    elif action == "del":
        job.is_active, job.review_status, job.closed_at = False, "rejected", datetime.utcnow()
        db.session.commit()
        _bust_cache()
        update(f"🗑 Removed: {e(job.title)}")
    elif action == "edit":
        update(card_text(job) + "\n\n✏️ What should I change?", field_buttons(job))
    elif action == "show":
        update(card_text(job), buttons_for(job))
    elif action == "ef" and extra in FIELDS:
        if extra == "kind":
            update(f"Type of #{job.id}:", [[{"text": k, "callback_data": f"kind:{job.id}:{k}"}] for k in KIND_CHOICES])
            return
        db.session.merge(BotState(chat_id=chat_id, job_id=job.id, field=extra, updated_at=datetime.utcnow()))
        db.session.commit()
        hint = {"deadline": " (like 2026-12-31, or 'none')", "link": " (starting with https://)"}.get(extra, "")
        send(chat_id, f"Send the new <b>{FIELDS[extra][0].lower()}</b> for #{job.id}{hint}.\nSend /cancel to stop.")
    elif action == "kind" and extra in KIND_CHOICES:
        set_field(job, "kind", extra)
        update("✅ Saved.\n\n" + card_text(job), buttons_for(job))


# ── Messages ─────────────────────────────────────────────────────────────────

def handle_links(chat_id, urls: list) -> None:
    if len(urls) > 1:
        send(chat_id, f"📥 Got {len(urls)} links. I'll check them one by one and send a card for each.")
    for url in urls:
        if not _public_url(url):
            send(chat_id, f"⚠️ I can't open that link: {e(url)}")
            continue
        if len(urls) == 1:
            send(chat_id, "🔎 Checking the link…")
        try:
            job, relevant, new, ai_ok = analyze(url)
            head = "🔎 <b>Link check</b>\n\n" if new else "ℹ️ <b>Already on ICOM</b>\n\n"
            send(chat_id, head + card_text(job, relevant, ai_ok), buttons_for(job))
        except Exception as err:
            db.session.rollback()
            send(chat_id, f"⚠️ Couldn't read {e(url)}\n{e(str(err)[:200])}")


def handle_update(update: dict) -> None:
    if update.get("callback_query"):
        button(update["callback_query"])
        return
    msg = update.get("message") or {}
    chat_id = (msg.get("chat") or {}).get("id")
    user_id = (msg.get("from") or {}).get("id")
    text = (msg.get("text") or msg.get("caption") or "").strip()
    if not chat_id or not text:
        return
    if user_id not in admin_ids():
        send(chat_id, HELP_OTHER + f"\n\nYour Telegram id: <code>{user_id}</code>")
        return
    state = db.session.get(BotState, chat_id)
    if text.startswith("/cancel"):
        if state:
            db.session.delete(state)
            db.session.commit()
        send(chat_id, "OK, stopped.")
        return
    if state and not text.startswith("/"):       # the answer to "send the new deadline…"
        job = db.session.get(Job, state.job_id)
        try:
            set_field(job, state.field, text)
            db.session.delete(state)
            db.session.commit()
            send(chat_id, "✅ Saved.\n\n" + card_text(job), buttons_for(job))
        except ValueError as err:
            send(chat_id, f"⚠️ {e(str(err))} Try again, or /cancel.")
        return
    if text.startswith("/"):
        command(chat_id, user_id, text)
        return
    urls = list(dict.fromkeys(re.findall(r"https?://[^\s<>\"]+", text)))[:MAX_LINKS]
    if urls:
        handle_links(chat_id, urls)
    else:
        send(chat_id, "Send me a link to an opportunity, or /help.")


def handle_update_async(flask_app, update: dict) -> None:
    """Answer Telegram at once; read pages and post in the background (pages can be slow)."""
    def work():
        with flask_app.app_context():
            try:
                handle_update(update)
            except Exception as err:
                db.session.rollback()
                print(f"[bot] update failed: {err}")
    if flask_app.config.get("TESTING"):
        work()
    else:
        threading.Thread(target=work, daemon=True, name="telegram-update").start()
