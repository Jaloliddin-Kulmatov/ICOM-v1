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


def _latin(text: str) -> str:
    """Drop characters the built-in font can't draw (Hangul and other scripts)."""
    text = re.sub(r"[^\x20-\x7E -ɏ–—‘’“”…₩]", "", text or "")
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
