"""
JBNU notice-board scraper for the ICOM News feed.

Scrapes the Jeonbuk National University English notice board
(https://www.jbnu.ac.kr/en/community/notice.do), which lists notices with
KOREAN titles even on the /en/ site. We pull three categories relevant to
international students, translate each title to English, and store them.

Categories (JBNU `category` query param):
    1 = 교육   (Education / general)
    2 = 국제   (International)
    3 = 학비   (Tuition / scholarship)

Only these three are scraped — foreigner-relevant by nature. Military-service
(병무) and other Korean-nationals-only boards are intentionally skipped.
"""

from __future__ import annotations

import re
import traceback

import requests

BASE = "https://www.jbnu.ac.kr"
LIST_URL = BASE + "/en/community/notice.do?category={cat}"
VIEW_URL = BASE + "/en/community/notice.do?mode=view&articleNo={aid}&category={cat}"

CATEGORIES = {
    "1": "education",
    "2": "international",
    "3": "tuition",
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9,ko;q=0.8",
}

# Skip notices that are clearly not for foreigners. Conservative — only the
# obvious Korean-nationals-only markers. "Foreigners allowed OR not mentioned"
# is the rule, so anything without these markers is kept.
_EXCLUDE_HINTS = ("병역", "병무", "군필", "예비군", "내국인만", "한국인만")


def _fetch(url: str) -> str:
    try:
        res = requests.get(url, headers=HEADERS, timeout=20)
        res.raise_for_status()
        return res.text
    except Exception as e:
        print(f"[jbnu] fetch failed for {url}: {e}")
        return ""


def _parse_rows(html: str) -> list[dict]:
    """Extract notice rows from a board-list page."""
    rows = re.split(r'<tr class="tr-normal">', html)[1:]
    out: list[dict] = []
    for row in rows:
        m_id = re.search(r"pf_DetailMove\('(\d+)'\)", row)
        if not m_id:
            continue
        article_id = m_id.group(1)

        m_title = re.search(r'class="title"[^>]*>(.*?)</a>', row, re.DOTALL)
        title_ko = ""
        if m_title:
            title_ko = re.sub(r"<[^>]+>", " ", m_title.group(1))
            title_ko = re.sub(r"\s+", " ", title_ko).strip()
        if not title_ko:
            continue

        m_date = re.search(r"(\d{4}-\d{2}-\d{2})", row)
        posted_date = m_date.group(1) if m_date else ""

        out.append({"article_id": article_id, "title_ko": title_ko, "posted_date": posted_date})
    return out


def _is_relevant(title_ko: str) -> bool:
    return not any(h in title_ko for h in _EXCLUDE_HINTS)


def run_notice_scraper(app, limit_per_category: int = 15) -> dict:
    """Scrape the three categories, translate titles, upsert into Notice.
    Returns a summary dict."""
    from app import db
    from models import Notice
    from scrapers.wanted import _google_translate  # free KO→EN translation

    summary = {"fetched": 0, "inserted": 0, "updated": 0, "skipped": 0, "errors": 0}

    with app.app_context():
        for cat_param, cat_name in CATEGORIES.items():
            html = _fetch(LIST_URL.format(cat=cat_param))
            if not html:
                summary["errors"] += 1
                continue

            rows = _parse_rows(html)[:limit_per_category]
            summary["fetched"] += len(rows)

            for r in rows:
                if not _is_relevant(r["title_ko"]):
                    summary["skipped"] += 1
                    continue
                try:
                    existing = Notice.query.filter_by(
                        source="jbnu", article_id=r["article_id"]
                    ).first()
                    url = VIEW_URL.format(aid=r["article_id"], cat=cat_param)

                    if existing:
                        # Refresh date/category; only (re)translate if missing.
                        existing.category = cat_name
                        existing.posted_date = r["posted_date"] or existing.posted_date
                        existing.url = url
                        if not existing.title_en:
                            existing.title_en = _google_translate(r["title_ko"]) or r["title_ko"]
                        existing.is_active = True
                        db.session.commit()
                        summary["updated"] += 1
                        continue

                    title_en = _google_translate(r["title_ko"]) or r["title_ko"]
                    notice = Notice(
                        source="jbnu",
                        article_id=r["article_id"],
                        category=cat_name,
                        title_ko=r["title_ko"],
                        title_en=title_en,
                        url=url,
                        posted_date=r["posted_date"],
                        is_active=True,
                    )
                    db.session.add(notice)
                    db.session.commit()
                    summary["inserted"] += 1
                except Exception as e:
                    db.session.rollback()
                    summary["errors"] += 1
                    print(f"[jbnu] write failed for article {r.get('article_id')}: {e}")

        print(
            f"[jbnu] done — fetched={summary['fetched']} inserted={summary['inserted']} "
            f"updated={summary['updated']} skipped={summary['skipped']} errors={summary['errors']}"
        )
    return summary
