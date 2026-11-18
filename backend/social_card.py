"""The picture for the daily Instagram post: a 1080x1350 JPEG listing the opportunities.

Instagram's API only takes JPEG images at a public URL, so the server draws
the card itself (GET /api/social/card.jpg?ids=1,2,3). Pillow's built-in font
covers Latin text only, so Korean characters are left out of the picture
(the imported titles are already English).
"""
import io
import re
import textwrap

from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1350
GREEN = (0, 127, 59)
INK = (22, 33, 58)
MUTED = (95, 105, 120)
BG = (246, 248, 246)
KIND_COLORS = {
    "scholarship": ((250, 232, 252), (134, 25, 143)),
    "contest": ((255, 237, 213), (154, 52, 18)),
    "program": ((252, 231, 243), (157, 23, 77)),
    "part-time": ((204, 251, 241), (17, 94, 89)),
    "internship": ((219, 234, 254), (30, 64, 175)),
}
LABELS = {"scholarship": "Scholarship", "contest": "Contest", "program": "Program",
          "part-time": "Part-time", "internship": "Internship"}


def _font(size: int):
    return ImageFont.load_default(size=size)


_PLAIN = str.maketrans({"\u2013": "-", "\u2014": "-", "\u2018": "'", "\u2019": "'", "\u201C": '"',
                        "\u201D": '"', "\u2026": "...", "\u20A9": "KRW "})


def _latin(text: str) -> str:
    """Plain look-alikes for typographic marks the built-in font lacks, and drop
    characters it can't draw at all (Hangul and other scripts)."""
    text = re.sub(r"[^\x20-\x7E\u00A0-\u024F]", "", (text or "").translate(_PLAIN))
    return re.sub(r"\s{2,}", " ", text).strip()


def render(items: list, days_left) -> bytes:
    """items: Job rows; days_left(job) -> str like "5 days left" or ""."""
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    d.rectangle([0, 0, W, 260], fill=GREEN)
    d.text((70, 60), "ICOM", font=_font(44), fill=(255, 255, 255))
    d.text((70, 120), "New opportunities for", font=_font(46), fill=(255, 255, 255))
    d.text((70, 172), "international students in Korea", font=_font(46), fill=(255, 255, 255))

    y = 300
    for job in items[:5]:
        kind = job.job_type if job.job_type in LABELS else "internship"
        fill, ink = KIND_COLORS[kind]
        title_lines = textwrap.wrap(_latin(job.title) or LABELS[kind], width=38)[:2]
        meta = " · ".join(x for x in (_latin(job.company or ""), days_left(job)) if x)
        box_h = 100 + 50 * len(title_lines) + (48 if meta else 0)
        if y + box_h > H - 130:
            break
        d.rounded_rectangle([50, y, W - 50, y + box_h], radius=28, fill=(255, 255, 255), outline=(225, 230, 228), width=2)
        label = LABELS[kind]
        lw = d.textlength(label, font=_font(28)) + 36
        d.rounded_rectangle([80, y + 24, 80 + lw, y + 66], radius=21, fill=fill)
        d.text((98, y + 30), label, font=_font(28), fill=ink)
        ty = y + 80
        for line in title_lines:
            d.text((80, ty), line, font=_font(40), fill=INK)
            ty += 50
        if meta:
            d.text((80, ty + 2), meta[:60], font=_font(30), fill=MUTED)
        y += box_h + 24

    d.text((70, H - 100), "Apply on icom.ai.kr/opportunities", font=_font(40), fill=GREEN)
    d.text((70, H - 52), "Link in bio", font=_font(28), fill=MUTED)

    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=90)
    return buf.getvalue()


# One colour per kind: (strong, light). Spotlight pictures use these instead of always ICOM green.
THEMES = {
    "scholarship": ((109, 40, 217), (243, 232, 255)),
    "contest": ((194, 65, 12), (255, 237, 213)),
    "program": ((190, 24, 93), (252, 231, 243)),
    "internship": ((29, 78, 216), (219, 234, 254)),
    "part-time": ((15, 118, 110), (204, 251, 241)),
}
NAVY = (22, 33, 58)
WHITE = (255, 255, 255)


def _wrap(d, text: str, size: int, width: int, max_lines: int) -> list:
    """Wrap by measured width, so big and small fonts both fill the line."""
    words, lines, line = (text or "").split(), [], ""
    for w in words:
        trial = f"{line} {w}".strip()
        if d.textlength(trial, font=_font(size)) <= width:
            line = trial
        else:
            if line:
                lines.append(line)
            line = w
    if line:
        lines.append(line)
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        lines[-1] = lines[-1].rstrip(".,;:") + "..."
    return lines


def _facts(job) -> list:
    return [(k, _latin(v)) for k, v in (("By", job.company or ""), ("Offer", job.salary or ""),
                                         ("Where", job.location or "")) if _latin(v)]


def _days_number(job):
    from datetime import date
    try:
        return (date.fromisoformat((job.deadline or "")[:10]) - date.today()).days
    except ValueError:
        return None


def _save_jpeg(img) -> bytes:
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=90)
    return buf.getvalue()


def _footer(d, color, sub_color):
    d.text((80, H - 130), "Apply on icom.ai.kr", font=_font(46), fill=color)
    d.text((80, H - 70), "ICOM - free for international students in Korea", font=_font(28), fill=sub_color)


def _layout_bold(job, days_left, strong, light):
    """Full colour poster: big white title."""
    img = Image.new("RGB", (W, H), strong)
    d = ImageDraw.Draw(img)
    d.text((80, 80), "ICOM  -  Opportunities in Korea", font=_font(34), fill=light)
    label = LABELS.get(job.job_type, "Internship").upper()
    d.rounded_rectangle([80, 170, 80 + d.textlength(label, font=_font(34)) + 56, 232], radius=31, fill=WHITE)
    d.text((108, 181), label, font=_font(34), fill=strong)
    lines = _wrap(d, _latin(job.title), 84, W - 160, 5)
    y = 300
    for line in lines:
        d.text((80, y), line, font=_font(84), fill=WHITE)
        y += 100
    y += 40
    for k, v in _facts(job):
        for line in _wrap(d, v, 40, W - 160, 2):
            d.text((80, y), line, font=_font(40), fill=light)
            y += 52
        y += 10
    left = days_left(job)
    if left:
        d.rounded_rectangle([80, H - 290, W - 80, H - 190], radius=28, fill=WHITE)
        d.text((120, H - 266), f"Deadline: {left}", font=_font(46), fill=strong)
    _footer(d, WHITE, light)
    return img


def _layout_card(job, days_left, strong, light):
    """Light page, white card with a colour bar; the card is as tall as its content."""
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    d.text((80, 80), "ICOM", font=_font(44), fill=GREEN)
    d.text((80, 135), "Opportunities for international students", font=_font(30), fill=MUTED)
    lines = _wrap(d, _latin(job.title), 66, W - 260, 4)
    facts = _facts(job)
    left = days_left(job)
    body_h = 110 + 82 * len(lines) + 40 + 64 * len(facts) + (110 if left else 0) + 40
    top = max(230, (H - 160 - body_h) // 2 + 60)
    d.rounded_rectangle([60, top, W - 60, top + body_h], radius=36, fill=WHITE, outline=(225, 230, 228), width=2)
    d.rectangle([60, top + 40, 76, top + body_h - 40], fill=strong)
    label = LABELS.get(job.job_type, "Internship").upper()
    d.rounded_rectangle([120, top + 40, 120 + d.textlength(label, font=_font(32)) + 48, top + 96], radius=28, fill=light)
    d.text((144, top + 50), label, font=_font(32), fill=strong)
    y = top + 130
    for line in lines:
        d.text((120, y), line, font=_font(66), fill=INK)
        y += 82
    y += 30
    for k, v in facts:
        d.text((120, y + 6), k, font=_font(30), fill=MUTED)
        d.text((270, y), _wrap(d, v, 38, W - 400, 1)[0], font=_font(38), fill=INK)
        y += 64
    if left:
        d.rounded_rectangle([120, y + 20, W - 120, y + 100], radius=22, fill=light)
        d.text((150, y + 38), f"Deadline: {left}", font=_font(40), fill=strong)
    _footer(d, GREEN, MUTED)
    return img


def _layout_countdown(job, days_left, strong, light):
    """A big circle with the days left (or OPEN), the title under it."""
    img = Image.new("RGB", (W, H), light)
    d = ImageDraw.Draw(img)
    d.text((80, 80), "ICOM  -  Opportunities in Korea", font=_font(34), fill=strong)
    cx, cy, r = W // 2, 470, 200
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=strong)
    n = _days_number(job)
    big, small = (str(max(n, 0)), "days left" if n != 1 else "day left") if n is not None and n >= 0 else ("OPEN", "apply now")
    bw = d.textlength(big, font=_font(130 if len(big) <= 3 else 96))
    d.text((cx - bw / 2, cy - 100), big, font=_font(130 if len(big) <= 3 else 96), fill=WHITE)
    sw = d.textlength(small, font=_font(40))
    d.text((cx - sw / 2, cy + 60), small, font=_font(40), fill=light)
    label = LABELS.get(job.job_type, "Internship").upper()
    lw = d.textlength(label, font=_font(32))
    d.text((cx - lw / 2, 730), label, font=_font(32), fill=strong)
    y = 795
    for line in _wrap(d, _latin(job.title), 64, W - 160, 3):
        tw = d.textlength(line, font=_font(64))
        d.text((cx - tw / 2, y), line, font=_font(64), fill=INK)
        y += 80
    org = _latin(job.company or "")
    if org:
        line = _wrap(d, org, 38, W - 160, 1)[0]
        d.text((cx - d.textlength(line, font=_font(38)) / 2, y + 20), line, font=_font(38), fill=MUTED)
    _footer(d, strong, MUTED)
    return img


def _layout_dark(job, days_left, strong, light):
    """Dark navy with coloured accents."""
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 18], fill=strong)
    d.text((80, 90), "NEW ON ICOM", font=_font(34), fill=light)
    label = LABELS.get(job.job_type, "Internship")
    d.text((80, 150), label, font=_font(48), fill=light)
    y = 270
    for line in _wrap(d, _latin(job.title), 78, W - 160, 5):
        d.text((80, y), line, font=_font(78), fill=WHITE)
        y += 94
    d.rectangle([80, y + 30, 240, y + 38], fill=light)
    y += 80
    for k, v in _facts(job):
        d.text((80, y + 6), k.upper(), font=_font(26), fill=(150, 165, 190))
        d.text((240, y), _wrap(d, v, 38, W - 320, 1)[0], font=_font(38), fill=WHITE)
        y += 62
    left = days_left(job)
    if left:
        d.rounded_rectangle([80, H - 290, 80 + d.textlength(f"Deadline: {left}", font=_font(42)) + 80, H - 200],
                            radius=45, fill=light)
        d.text((120, H - 268), f"Deadline: {left}", font=_font(42), fill=strong)
    _footer(d, light, (150, 165, 190))
    return img


LAYOUTS = (_layout_bold, _layout_card, _layout_countdown, _layout_dark)


def render_spotlight(job, days_left) -> bytes:
    """One opportunity, big: for Telegram spotlights and albums. The design changes from post
    to post (by id) and the colours follow the kind, so the channel doesn't look the same every day."""
    strong, light = THEMES.get(job.job_type, THEMES["internship"])
    return _save_jpeg(LAYOUTS[job.id % len(LAYOUTS)](job, days_left, strong, light))
