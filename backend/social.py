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
    return [p for p, ok in (("telegram", telegram_configured()), ("instagram", instagram_configured())) if ok]


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
    lines = [f"{icon} <b>{label.upper()}</b>", f"<b>{e(job.title)}</b>", ""]
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


def send_spotlight(job: Job) -> None:
    telegram_api("sendPhoto", chat_id=os.environ["TELEGRAM_CHANNEL_ID"], photo=card_url([job], "spotlight"),
                 caption=spotlight_caption(job), parse_mode="HTML", reply_markup=apply_button(job))


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


def _graph(method: str, path: str, **params) -> dict:
    params["access_token"] = os.environ["INSTAGRAM_ACCESS_TOKEN"]
    r = requests.request(method, f"{GRAPH}/{path}", timeout=60, **({"params": params} if method == "GET" else {"data": params}))
    body = r.json() if r.headers.get("content-type", "").startswith(("application/json", "text/javascript")) else {}
    if r.status_code != 200 or "error" in body:
        raise RuntimeError((body.get("error") or {}).get("message") or f"Instagram answered {r.status_code}")
    return body


def send_instagram(items: list) -> None:
    """Create the picture post, wait until Instagram has fetched the picture, then publish it."""
    user = os.environ["INSTAGRAM_USER_ID"]
    container = _graph("POST", f"{user}/media", image_url=card_url(items), caption=build_caption(items))["id"]
    for _ in range(10):
        status = _graph("GET", container, fields="status_code").get("status_code")
        if status == "FINISHED":
            break
        if status == "ERROR":
            raise RuntimeError("Instagram couldn't use the picture")
        time.sleep(3)
    _graph("POST", f"{user}/media_publish", creation_id=container)


def posted_today() -> bool:
    start = datetime.utcnow() - timedelta(hours=20)
    return SocialPost.query.filter(SocialPost.status == "posted", SocialPost.created_at > start).first() is not None


def run(force: bool = False) -> dict:
    """Post today's digest to every connected platform. Without force, at most once a day."""
    targets = platforms()
    if not targets:
        return {"status": "not_configured"}
    if not force and posted_today():
        return {"status": "already_posted"}
    items = pick_items()
    if not items:
        return {"status": "nothing_new"}
    results, errors = {}, []
    style = pick_style()
    for platform in targets:
        text = digest_caption(items) if platform == "telegram" else build_caption(items)
        post = SocialPost(platform=platform, text=text, job_ids=[j.id for j in items], status="posted")
        try:
            if platform == "telegram":
                note = post_telegram(items, style)
                if note:
                    post.error = note[:300]
            else:
                send_instagram(items)
        except Exception as e:   # shown to admins; the other platform still posts
            post.status, post.error = "failed", str(e)[:300]
            errors.append(f"{platform}: {post.error}")
        db.session.add(post)
        results[platform] = post.status
    if "posted" in results.values():   # if every platform failed, keep the items for tomorrow
        now = datetime.utcnow()
        for j in items:
            j.posted_at = now
    db.session.commit()
    return {"status": "posted" if "posted" in results.values() else "failed", "items": len(items),
            "platforms": results, "style": style, "error": "; ".join(errors)}


def run_scheduled(flask_app) -> None:
    with flask_app.app_context():
        try:
            print(f"[social] {run()}")
        except Exception as e:
            db.session.rollback()
            print(f"[social] failed: {e}")
