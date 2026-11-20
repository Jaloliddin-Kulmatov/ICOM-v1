"""Daily opportunities post for social media.

Every morning ICOM collects opportunities that went live recently and have not
been posted yet, and posts one digest to each connected platform: the ICOM
Telegram channel (text with links, ?ref=telegram) and Instagram (a picture card
from social_card.py with the list in the caption). Each posting goes out once
(jobs.posted_at).

Settings (Render environment):
  TELEGRAM_BOT_TOKEN      from @BotFather; the bot must be an admin of the channel
  TELEGRAM_CHANNEL_ID     "@yourchannel" or the channel's numeric id
  INSTAGRAM_USER_ID       the Instagram business account id (from the Graph API)
  INSTAGRAM_ACCESS_TOKEN  long-lived token with instagram_content_publish
  PUBLIC_API_URL          this server's public /api address, for the card picture
"""
import html
import json
import os
import re
import time
from datetime import datetime, timedelta

import requests

from app import db
from job_lifecycle import is_listed, kst_today
from models import Job, SocialPost

SITE = os.environ.get("FRONTEND_URL", "https://icom.ai.kr").rstrip("/")
GRAPH = "https://graph.facebook.com/" + os.environ.get("META_GRAPH_VERSION", "v23.0")
MAX_ITEMS = 8
CARD_ITEMS = 5          # what fits on the Instagram picture
CAPTION_LIMIT = 2200
FRESH_DAYS = 3          # only postings that went live in the last few days
TELEGRAM_LIMIT = 4096   # characters per message
PHOTO_CAPTION_LIMIT = 1024
STYLES = ("digest", "album", "spotlight")   # the Telegram post changes look day by day

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


def instagram_configured() -> bool:
    return bool(os.environ.get("INSTAGRAM_USER_ID") and os.environ.get("INSTAGRAM_ACCESS_TOKEN"))


def platforms() -> list:
    return [p for p, ok in (("telegram", telegram_configured()), ("instagram", instagram_configured()),
                            ("facebook", facebook_configured())) if ok]


def _went_live(j: Job) -> datetime:
    # Shared and imported items go live when an admin approves them (checked_at), not when they arrive.
    return j.checked_at if (j.created_by or j.source_url) and j.checked_at else j.created_at


def pick_items(now: datetime | None = None) -> list:
    now = now or datetime.utcnow()
    cutoff = now - timedelta(days=FRESH_DAYS)
    rows = (Job.query.filter(Job.is_active.is_(True), Job.posted_at.is_(None),
                             db.or_(Job.created_at > cutoff, Job.checked_at > cutoff))
            .order_by(Job.created_at.desc()).limit(300).all())
    rows = [j for j in rows if is_listed(j) and _went_live(j) > cutoff]
    rows.sort(key=lambda j: (ORDER.index(_kind(j)), j.foreigner_friendly != "yes", -j.created_at.timestamp()))
    return rows[:MAX_ITEMS]


def days_left(job: Job) -> str:
    raw = (job.deadline or "").strip()[:10]
    try:
        days = (datetime.fromisoformat(raw).date() - kst_today()).days
    except ValueError:
        return ""
    return "closes today" if days <= 0 else "1 day left" if days == 1 else f"{days} days left"


def _deadline(job: Job) -> str:
    left = days_left(job)
    return f"⏳ {left}" if left else ""


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


def telegram_api(method: str, **data) -> dict:
    """Call the Telegram Bot API; raise with Telegram's own message when it refuses."""
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    for k, v in list(data.items()):
        if isinstance(v, (list, dict)):
            data[k] = json.dumps(v, ensure_ascii=False)
    r = requests.post(f"https://api.telegram.org/bot{token}/{method}", timeout=30, data=data)
    body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    if r.status_code != 200 or not body.get("ok"):
        raise RuntimeError(body.get("description") or f"Telegram answered {r.status_code}")
    return body


def send_telegram(text: str) -> None:
    telegram_api("sendMessage", chat_id=os.environ["TELEGRAM_CHANNEL_ID"], text=text,
                 parse_mode="HTML", disable_web_page_preview="true")


# ── Telegram with pictures ───────────────────────────────────────────────────

def link(job: Job, ref: str = "telegram") -> str:
    return f"{SITE}/internships/{job.id}?ref={ref}"


def _who(job: Job) -> str:
    m = re.search(r"Who can apply: (.+)", job.description or "")
    return m.group(1).strip()[:120] if m else ""


def item_line(job: Job, ref: str = "telegram") -> str:
    """One compact line: 💼 Title (linked) — Company · ⏳ 5 days left"""
    e = html.escape
    icon, _ = KINDS[_kind(job)]
    facts = " · ".join(x for x in (e(job.company or ""), _deadline(job)) if x)
    return f'{icon} <a href="{link(job, ref)}"><b>{e(job.title)}</b></a>' + (f" — {facts}" if facts else "")


def spotlight_caption(job: Job) -> str:
    """The full card for one opportunity: kind, title, organizer, amount, deadline, who can apply."""
    e = html.escape
    icon, label = KINDS[_kind(job)]
    lines = [f"{opener(job)} · {icon} <b>{label}</b>", f"<b>{e(job.title)}</b>", ""]
    if job.company:
        lines.append(f"🏢 {e(job.company)}")
    if job.salary:
        lines.append(f"💰 {e(job.salary)}")
    if job.location:
        lines.append(f"📍 {e(job.location)}")
    if job.deadline and days_left(job):
        lines.append(f"⏳ Deadline {e(job.deadline[:10])} ({days_left(job)})")
    if _who(job):
        lines.append(f"✅ {e(_who(job))}")
    lines += ["", f"#ICOM #{label.replace('-', '')} #InternationalStudents #Korea"]
    return "\n".join(lines)[:PHOTO_CAPTION_LIMIT]


OPENERS = ("📌 New on ICOM", "🔥 Don't miss this", "💡 Opportunity of the day", "✨ Fresh pick",
           "🎯 Worth applying", "👀 Have you seen this?")


def opener(job: Job) -> str:
    """A different first line from post to post; a near deadline always says so."""
    left = days_left(job)
    if left == "closes today":
        return "🚨 Last day to apply"
    if left and left.split()[0].isdigit() and int(left.split()[0]) <= 7:
        return "⏰ Closing soon"
    return OPENERS[job.id % len(OPENERS)]


def digest_caption(items: list) -> str:
    head = "🇰🇷 <b>New for international students in Korea</b>\nYangi imkoniyatlar · Новые возможности · 새 기회\n"
    tail = f'\n<a href="{SITE}/opportunities?ref=telegram">All opportunities on ICOM →</a>'
    lines = []
    for j in items:
        line = item_line(j)
        if len(head) + len(tail) + sum(len(x) + 2 for x in lines) + len(line) > PHOTO_CAPTION_LIMIT - 40:
            lines.append(f"…and {len(items) - len(lines)} more on ICOM")
            break
        lines.append(line)
    return head + "\n" + "\n\n".join(lines) + "\n" + tail


def apply_button(job: Job | None = None) -> dict:
    url, text = (link(job), "Apply on ICOM") if job else (f"{SITE}/opportunities?ref=telegram", "See all on ICOM")
    return {"inline_keyboard": [[{"text": text, "url": url}]]}


def pick_style(today=None) -> str:
    return STYLES[(today or kst_today()).toordinal() % len(STYLES)]


def channel_handle() -> str:
    chat = os.environ.get("TELEGRAM_CHANNEL_ID", "")
    return chat if chat.startswith("@") else ""


FOOTER = {
    "uz": ("🌐 Rasmiy sayt / Manba", "⛓ Batafsil va ariza", "➡️ Bizning kanal"),
    "en": ("🌐 Official site", "⛓ Details and apply", "➡️ Our channel"),
    "ru": ("🌐 Официальный сайт", "⛓ Подробнее и подать", "➡️ Наш канал"),
}


def post_body(job: Job) -> str:
    """The full post (AI-written, HTML-safe) with links and the channel, or the standard caption."""
    if not (job.post_text or "").strip():
        return spotlight_caption(job)
    from opportunity_import import post_language
    site, apply, ours = FOOTER[post_language()]
    lines = [html.escape(l) for l in job.post_text.strip().split("\n")]
    lines[0] = f"<b>{lines[0]}</b>"                         # the headline in bold
    lines += [""]
    if job.apply_link:
        lines.append(f"{site}: {html.escape(job.apply_link)}")
    lines.append(f"{apply}: {link(job)}")
    if channel_handle():
        lines += ["", f"{ours}: {channel_handle()}"]
    return "\n".join(lines)[:TELEGRAM_LIMIT]


def send_spotlight(job: Job) -> str:
    """Post one opportunity. A short post is a picture with a caption; a long one (over Telegram's
    1024-character caption limit) is a message with the picture shown big above the text.
    Returns the message id, "t:<id>" for the long kind, so it can be edited later."""
    chat, body = os.environ["TELEGRAM_CHANNEL_ID"], post_body(job)
    if len(body) <= PHOTO_CAPTION_LIMIT:
        res = telegram_api("sendPhoto", chat_id=chat, photo=card_url([job], "spotlight"),
                           caption=body, parse_mode="HTML", reply_markup=apply_button(job))
        return str((res.get("result") or {}).get("message_id") or "")
    res = telegram_api("sendMessage", chat_id=chat, text=body, parse_mode="HTML", reply_markup=apply_button(job),
                       link_preview_options={"url": card_url([job], "spotlight"), "prefer_large_media": True,
                                             "show_above_text": True})
    message_id = (res.get("result") or {}).get("message_id")
    return f"t:{message_id}" if message_id else ""


def edit_spotlight(job: Job, message_id: str) -> None:
    """Change a spotlight already in the channel to match the opportunity now."""
    chat, body = os.environ["TELEGRAM_CHANNEL_ID"], post_body(job)
    if message_id.startswith("t:"):
        telegram_api("editMessageText", chat_id=chat, message_id=message_id[2:], text=body, parse_mode="HTML",
                     reply_markup=apply_button(job),
                     link_preview_options={"url": card_url([job], "spotlight"), "prefer_large_media": True,
                                           "show_above_text": True})
    else:
        caption = body if len(body) <= PHOTO_CAPTION_LIMIT else spotlight_caption(job)
        telegram_api("editMessageCaption", chat_id=chat, message_id=message_id, caption=caption,
                     parse_mode="HTML", reply_markup=apply_button(job))


def post_telegram(items: list, style: str) -> str:
    """Post in today's style. If Telegram can't use the picture, fall back to text so nothing is lost."""
    chat = os.environ["TELEGRAM_CHANNEL_ID"]
    try:
        if style == "spotlight":
            send_spotlight(items[0])
            if items[1:]:
                rest = "\n\n".join(item_line(j) for j in items[1:])
                telegram_api("sendMessage", chat_id=chat, text=f"<b>Also new today</b>\n\n{rest}",
                             parse_mode="HTML", disable_web_page_preview="true", reply_markup=apply_button())
        elif style == "album" and len(items) > 1:
            media = [{"type": "photo", "media": card_url([j], "spotlight")} for j in items[:CARD_ITEMS]]
            media[0].update(caption=digest_caption(items), parse_mode="HTML")
            telegram_api("sendMediaGroup", chat_id=chat, media=media)
        else:
            telegram_api("sendPhoto", chat_id=chat, photo=card_url(items), caption=digest_caption(items),
                         parse_mode="HTML", reply_markup=apply_button())
        return ""
    except RuntimeError as e:
        send_telegram(build_text(items))
        return f"picture post failed ({e}); sent as text"


def build_caption(items: list) -> str:
    """Instagram caption: plain text (links aren't clickable there), the list, and hashtags."""
    lines = ["New opportunities for international students in Korea 🇰🇷", ""]
    for j in items:
        icon, label = KINDS[_kind(j)]
        left = days_left(j)
        lines.append(f"{icon} {label}: {j.title} ({j.company}){' · ' + left if left else ''}")
    lines += ["", "Apply and see all opportunities on icom.ai.kr/opportunities (link in bio).",
              "Yangi imkoniyatlar · Новые возможности · 새 기회", "",
              "#Korea #InternationalStudents #Scholarship #StudyInKorea #유학생 #공모전 #ICOM"]
    caption = "\n".join(lines)
    return caption if len(caption) <= CAPTION_LIMIT else caption[:CAPTION_LIMIT - 1] + "…"


def card_url(items: list, style: str = "list") -> str:
    api = os.environ.get("PUBLIC_API_URL", "https://icom-v1.onrender.com/api").rstrip("/")
    ids = ",".join(str(j.id) for j in items[:CARD_ITEMS])
    extra = "&style=spotlight" if style == "spotlight" else ""
    # the day in the address makes Telegram and Instagram fetch a fresh picture (deadlines change daily)
    return f"{api}/admin/social/card.jpg?ids={ids}{extra}&d={kst_today().isoformat()}"


def _graph(method: str, path: str, token: str | None = None, **params) -> dict:
    params["access_token"] = token or os.environ["INSTAGRAM_ACCESS_TOKEN"]
    r = requests.request(method, f"{GRAPH}/{path}", timeout=60, **({"params": params} if method == "GET" else {"data": params}))
    body = r.json() if r.headers.get("content-type", "").startswith(("application/json", "text/javascript")) else {}
    if r.status_code != 200 or "error" in body:
        raise RuntimeError((body.get("error") or {}).get("message") or f"Meta answered {r.status_code}")
    return body


def send_instagram(items: list, caption: str | None = None) -> None:
    """Create the picture post, wait until Instagram has fetched the picture, then publish it."""
    user = os.environ["INSTAGRAM_USER_ID"]
    container = _graph("POST", f"{user}/media", image_url=card_url(items), caption=caption or build_caption(items))["id"]
    for _ in range(10):
        status = _graph("GET", container, fields="status_code").get("status_code")
        if status == "FINISHED":
            break
        if status == "ERROR":
            raise RuntimeError("Instagram couldn't use the picture")
        time.sleep(3)
    _graph("POST", f"{user}/media_publish", creation_id=container)


# ── Facebook Page ────────────────────────────────────────────────────────────

def facebook_configured() -> bool:
    return bool(os.environ.get("FACEBOOK_PAGE_ID") and os.environ.get("FACEBOOK_PAGE_TOKEN"))


def build_facebook_caption(items: list) -> str:
    """Facebook shows links, so each opportunity gets its own (?ref=facebook)."""
    lines = ["🇰🇷 New opportunities for international students in Korea", ""]
    for j in items:
        icon, label = KINDS[_kind(j)]
        left = days_left(j)
        lines += [f"{icon} {label}: {j.title} ({j.company}){' · ' + left if left else ''}", link(j, "facebook"), ""]
    lines += [f"All opportunities: {SITE}/opportunities?ref=facebook", "", "#ICOM #InternationalStudents #Korea #StudyInKorea"]
    return "\n".join(lines)[:CAPTION_LIMIT * 2]


def send_facebook(items: list, caption: str | None = None) -> None:
    _graph("POST", f"{os.environ['FACEBOOK_PAGE_ID']}/photos", token=os.environ["FACEBOOK_PAGE_TOKEN"],
           url=card_url(items), message=caption or build_facebook_caption(items), published="true")


# ── Drafts that wait for an admin (Instagram and Facebook) ──────────────────

APPROVAL_PLATFORMS = {"instagram": (instagram_configured, build_caption, send_instagram),
                      "facebook": (facebook_configured, build_facebook_caption, send_facebook)}


def make_drafts(items: list, source: str) -> list:
    """Prepare today's Instagram/Facebook posts; nothing goes out until an admin approves."""
    drafts = []
    for platform, (configured, caption, _send) in APPROVAL_PLATFORMS.items():
        if configured():
            post = SocialPost(platform=platform, text=caption(items), job_ids=[j.id for j in items],
                              status="draft", source=source)
            db.session.add(post)
            drafts.append(post)
    return drafts


def approve_draft(post: SocialPost, caption: str | None = None) -> SocialPost:
    """Publish a waiting draft (optionally with an edited caption)."""
    if post.status != "draft" or post.platform not in APPROVAL_PLATFORMS:
        raise ValueError("This post isn't waiting for approval any more.")
    from job_lifecycle import is_listed
    by_id = {j.id: j for j in Job.query.filter(Job.id.in_(post.job_ids or [])).all()}
    items = [by_id[i] for i in post.job_ids or [] if i in by_id and is_listed(by_id[i])]
    if not items:
        raise ValueError("Every opportunity in this post has closed or been removed.")
    if caption and caption.strip():
        post.text = caption.strip()[:CAPTION_LIMIT * 2]
    try:
        APPROVAL_PLATFORMS[post.platform][2](items, post.text)
        post.status, post.error = "posted", None
    except Exception as e:
        post.status, post.error = "failed", str(e)[:300]
    post.created_at = datetime.utcnow()
    db.session.commit()
    return post


def skip_draft(post: SocialPost) -> SocialPost:
    if post.status == "draft":
        post.status = "skipped"
        db.session.commit()
    return post


def notify_admins(drafts: list) -> None:
    """Send each draft to the bot's admins with Post / Skip buttons."""
    if not drafts or not os.environ.get("TELEGRAM_BOT_TOKEN"):
        return
    import telegram_bot
    from job_lifecycle import is_listed
    for post in drafts:
        jobs = [j for j in Job.query.filter(Job.id.in_(post.job_ids or [])).all() if is_listed(j)]
        if not jobs:
            continue
        name = post.platform.title()
        for admin in telegram_bot.admin_ids():
            try:
                telegram_api("sendPhoto", chat_id=admin, photo=card_url(jobs),
                             caption=f"📝 <b>{name} post waiting for you</b>\n\n{html.escape(post.text)}"[:PHOTO_CAPTION_LIMIT],
                             parse_mode="HTML", reply_markup={"inline_keyboard": [[
                                 {"text": f"✅ Post to {name}", "callback_data": f"sd:{post.id}"},
                                 {"text": "❌ Skip", "callback_data": f"sx:{post.id}"}]]})
            except Exception as e:     # an admin who never started the bot can't be messaged
                print(f"[social] couldn't notify {admin}: {e}")


# ── The daily run ────────────────────────────────────────────────────────────

def posted_today() -> bool:
    """Has the 09:00 post already gone out today (Korea date)? Bot posts and Post now don't count."""
    midnight_kst = datetime.combine(kst_today(), datetime.min.time()) - timedelta(hours=9)
    return SocialPost.query.filter(SocialPost.source == "daily", SocialPost.status.in_(("posted", "draft")),
                                   SocialPost.created_at >= midnight_kst).first() is not None


def run(force: bool = False) -> dict:
    """Telegram gets today's digest straight away; Instagram and Facebook get drafts that wait for an
    admin. Without force (the 09:00 job) it runs at most once per Korea date."""
    if not platforms():
        return {"status": "not_configured"}
    if not force and posted_today():
        return {"status": "already_posted"}
    items = pick_items()
    if not items:
        return {"status": "nothing_new"}
    source = "manual" if force else "daily"
    results, errors = {}, []
    style = pick_style()
    if telegram_configured():
        post = SocialPost(platform="telegram", text=digest_caption(items), job_ids=[j.id for j in items],
                          status="posted", source=source)
        try:
            note = post_telegram(items, style)
            if note:
                post.error = note[:300]
        except Exception as e:   # shown to admins; the drafts are still made
            post.status, post.error = "failed", str(e)[:300]
            errors.append(f"telegram: {post.error}")
        db.session.add(post)
        results["telegram"] = post.status
    drafts = make_drafts(items, source)
    for d in drafts:
        results[d.platform] = "waiting_approval"
    if "posted" in results.values() or drafts:   # handled; if everything failed, keep them for tomorrow
        now = datetime.utcnow()
        for j in items:
            j.posted_at = now
    db.session.commit()
    notify_admins(drafts)
    ok = "posted" in results.values() or bool(drafts)
    return {"status": "posted" if ok else "failed", "items": len(items),
            "platforms": results, "style": style, "error": "; ".join(errors)}


def run_scheduled(flask_app) -> None:
    with flask_app.app_context():
        try:
            print(f"[social] {run()}")
        except Exception as e:
            db.session.rollback()
            print(f"[social] failed: {e}")
