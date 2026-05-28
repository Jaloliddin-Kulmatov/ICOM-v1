"""
Wanted.co.kr internship scraper.

Pulls the latest Korean internship listings off the Wanted public API, normalises
each posting into our Job model, deduplicates against existing apply_link values,
and inserts up to MAX_PER_RUN new rows per run.

Run modes:
  - Scheduled: APScheduler fires `run_scraper(app)` twice a day (06:00 / 18:00 UTC)
  - Manual: POST /api/admin/jobs/scrape-now triggers it in a background thread

Environment variables (all optional):
  WANTED_QUERY      — search keyword (default: "인턴")
  WANTED_LIMIT      — max listings to pull from the list endpoint (default: 40)
  MAX_PER_RUN       — cap on inserts per run (default: 15)
  DISABLE_SCHEDULER — set to "1" to skip background scheduling (still allows manual run)
"""

from __future__ import annotations

import json
import os
import time
import traceback
from typing import Optional

import requests

LIST_URL   = "https://www.wanted.co.kr/api/v4/jobs"
DETAIL_URL = "https://www.wanted.co.kr/api/v4/jobs/{id}"
PUBLIC_URL = "https://www.wanted.co.kr/wd/{id}"

# A real browser User-Agent — the Wanted API rejects default python-requests.
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
    "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
    "Referer": "https://www.wanted.co.kr/",
}

# Tunables ---------------------------------------------------------------------

def _env_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


def _query() -> str:
    return os.environ.get("WANTED_QUERY", "인턴")


def _limit() -> int:
    return _env_int("WANTED_LIMIT", 80)


def _max_per_run() -> int:
    return _env_int("MAX_PER_RUN", 40)


# HTTP helpers ----------------------------------------------------------------

def _fetch_list() -> list[dict]:
    """Fetch the list page; return the raw items array (may be empty on error)."""
    params = {
        # As of 2026 the Wanted API rejects requests without a country with
        # 422 "Missing data for required field". Defaults to Korea.
        "country": os.environ.get("WANTED_COUNTRY", "kr"),
        "query": _query(),
        "limit": _limit(),
        "job_sort": "job.latest_order",
        "locations": "all",
        "years": -1,
    }
    try:
        res = requests.get(LIST_URL, params=params, headers=HEADERS, timeout=15)
        res.raise_for_status()
        payload = res.json()
    except Exception as e:
        print(f"[wanted] list fetch failed: {e}")
        return []

    # Wanted's API wraps the payload in {"data": [...]} but we stay defensive
    # in case the shape changes.
    if isinstance(payload, dict):
        for key in ("data", "jobs", "results"):
            value = payload.get(key)
            if isinstance(value, list):
                return value
        return []
    if isinstance(payload, list):
        return payload
    return []


def _fetch_detail(job_id) -> Optional[dict]:
    try:
        url = DETAIL_URL.format(id=job_id)
        res = requests.get(url, headers=HEADERS, timeout=15)
        res.raise_for_status()
        payload = res.json()
    except Exception as e:
        print(f"[wanted] detail fetch failed for id={job_id}: {e}")
        return None

    # The detail endpoint usually nests the job under {"job": {...}}; fall back
    # to the root object if that wrapper is gone.
    if isinstance(payload, dict):
        return payload.get("job") if isinstance(payload.get("job"), dict) else payload
    return None


# Parsing ---------------------------------------------------------------------

def _clean_text(value) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _join_sections(*sections: str) -> str:
    """Join non-empty multi-line sections with a blank line between them."""
    parts = [s.strip() for s in sections if s and s.strip()]
    return "\n\n".join(parts)


# Translation + foreigner-friendly detection -----------------------------------

_TRANSLATION_PROMPT = """You translate Korean job postings from Wanted.co.kr to clean English for an audience of international students in Korea, and determine whether foreign applicants are welcome.

Rules:
- Translate EVERY field, including company names and location. For well-known
  Korean brands keep the established English name (Samsung, Kakao, Naver,
  LG, Coupang, etc.). For lesser-known company names, transliterate
  phonetically (e.g. "넥스트그라운드" → "Nextground", "비자르큐브" → "Visarcube").
- Translate cities and addresses to English: 서울 → Seoul, 전주 → Jeonju,
  부산 → Busan, 강남구 → Gangnam-gu, etc.
- Keep formatting: line breaks between sections, bullet points if present.
- For the foreigner_friendly field, decide one of:
    "yes"      → the posting explicitly welcomes foreigners, says English-OK, no Korean fluency required, or English is the working language.
    "no"       → it requires Korean fluency/native level, requires Korean military service completion, or otherwise excludes foreigners.
    "unclear"  → no language requirement mentioned. Default for typical Korean-language postings.
- foreigner_note: ONE short English sentence explaining the decision (max 120 chars).

Return STRICT JSON only — no markdown, no commentary. Schema:
{
  "title": "<English title>",
  "company": "<English company>",
  "location": "<English location>",
  "description": "<English description>",
  "requirements": "<English requirements>",
  "foreigner_friendly": "yes" | "no" | "unclear",
  "foreigner_note": "<short reason>"
}
"""


# Google Translate (unofficial public endpoint) — free, no key required ---------
# Used as a fallback when GROQ_API_KEY is not configured. Slower-quality
# translation than Groq, but reliable and zero-cost.

_GTRANS_URL = "https://translate.googleapis.com/translate_a/single"
_GTRANS_MAX_CHARS = 4500  # Google rejects requests over ~5000 chars


def _google_translate(text: str) -> str:
    """Translate Korean → English via Google's public endpoint. Returns the
    original text on any failure so we never lose data."""
    text = (text or "").strip()
    if not text:
        return ""
    # Chunk long text on paragraph boundaries to stay under the limit
    if len(text) > _GTRANS_MAX_CHARS:
        # Split on blank lines, translate each chunk, rejoin
        chunks: list[str] = []
        buf = ""
        for para in text.split("\n\n"):
            if len(buf) + len(para) + 2 > _GTRANS_MAX_CHARS:
                if buf:
                    chunks.append(buf)
                buf = para
            else:
                buf = (buf + "\n\n" + para) if buf else para
        if buf:
            chunks.append(buf)
        return "\n\n".join(_google_translate(c) for c in chunks)

    try:
        res = requests.get(
            _GTRANS_URL,
            params={
                "client": "gtx",
                "sl": "ko",
                "tl": "en",
                "dt": "t",
                "q": text,
            },
            headers={"User-Agent": HEADERS["User-Agent"]},
            timeout=15,
        )
        res.raise_for_status()
        data = res.json()
        # Response shape: [[ ["en chunk", "ko chunk", null, null, …], … ], …]
        if not isinstance(data, list) or not data or not isinstance(data[0], list):
            return text
        out_parts = [seg[0] for seg in data[0] if isinstance(seg, list) and seg]
        return "".join(out_parts) or text
    except Exception as e:
        print(f"[wanted] google translate failed: {e}")
        return text


# Korean keyword heuristic for foreigner-friendliness (only used when Groq
# isn't available). Matches against the ORIGINAL Korean text so we don't lose
# signal in translation noise.
_KOREAN_NEGATIVE = (
    "한국어 능통", "한국어능통", "원어민",
    "병역", "군필", "한국 국적", "한국국적",
)
_ENGLISH_POSITIVE = (
    "영어 가능", "영어가능", "영어 능통", "영어능통",
    "english", "English", "외국인 환영", "글로벌",
)


def _detect_foreigner_friendly(text: str) -> tuple[str, str]:
    """Cheap keyword-based classification used as a fallback when Groq
    isn't available. Returns (foreigner_friendly, foreigner_note)."""
    if not text:
        return ("unclear", "")
    has_neg = any(kw in text for kw in _KOREAN_NEGATIVE)
    has_pos = any(kw in text for kw in _ENGLISH_POSITIVE)
    if has_neg and not has_pos:
        return ("no", "Korean fluency or local citizenship mentioned in requirements.")
    if has_pos and not has_neg:
        return ("yes", "Mentions English / welcomes foreigners.")
    return ("unclear", "Eligibility for foreign applicants not explicitly stated.")


def _translate_with_groq(parsed: dict) -> dict:
    """Translate Korean job fields to English and classify foreigner-friendliness.

    Tries Groq first (best quality + accurate classification). Falls back to
    free Google Translate + keyword heuristic when GROQ_API_KEY is missing or
    Groq errors out. Either way the function never loses data — on total
    failure the original Korean is preserved.
    """
    out = dict(parsed)
    out.setdefault("foreigner_friendly", "")
    out.setdefault("foreigner_note", "")

    api_key = os.environ.get("GROQ_API_KEY", "").strip()

    # ── Path A — Groq (best) ──────────────────────────────────────────────
    if api_key:
        payload_in = {
            "title": parsed.get("title", "")[:200],
            "company": parsed.get("company", "")[:150],
            "location": parsed.get("location", "")[:150],
            "description": parsed.get("description", "")[:4000],
            "requirements": parsed.get("requirements", "")[:3000],
        }
        try:
            from groq import Groq
            client = Groq(api_key=api_key)
            resp = client.chat.completions.create(
                model=os.environ.get("WANTED_TRANSLATE_MODEL", "llama-3.3-70b-versatile"),
                messages=[
                    {"role": "system", "content": _TRANSLATION_PROMPT},
                    {"role": "user", "content": json.dumps(payload_in, ensure_ascii=False)},
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
                max_tokens=2000,
            )
            raw = resp.choices[0].message.content or "{}"
            data = json.loads(raw)

            title = _clean_text(data.get("title"))
            company = _clean_text(data.get("company"))
            location = _clean_text(data.get("location"))
            description = _clean_text(data.get("description"))
            requirements = _clean_text(data.get("requirements"))
            foreigner_friendly = _clean_text(data.get("foreigner_friendly")).lower()
            foreigner_note = _clean_text(data.get("foreigner_note"))
            if foreigner_friendly not in {"yes", "no", "unclear"}:
                foreigner_friendly = "unclear"

            if title:        out["title"]        = title[:200]
            if company:      out["company"]      = company[:150]
            if location:     out["location"]     = location[:150]
            if description:  out["description"]  = description
            if requirements: out["requirements"] = requirements
            out["foreigner_friendly"] = foreigner_friendly
            out["foreigner_note"]     = foreigner_note[:300]
            return out
        except Exception as e:
            print(f"[wanted] Groq translation failed, falling back to Google: {e}")
            # fall through to Path B

    # ── Path B — Google Translate fallback ────────────────────────────────
    # Detect foreigner-friendly from the ORIGINAL Korean first (more signal
    # than the translation), then translate every visible text field.
    original_req = parsed.get("requirements", "")
    original_desc = parsed.get("description", "")
    friendly, note = _detect_foreigner_friendly(original_req + "\n" + original_desc)

    out["title"]        = _google_translate(parsed.get("title", ""))[:200] or parsed.get("title", "")
    out["company"]      = _google_translate(parsed.get("company", ""))[:150] or parsed.get("company", "")
    out["location"]     = _google_translate(parsed.get("location", ""))[:150] or parsed.get("location", "")
    out["description"]  = _google_translate(parsed.get("description", "")) or parsed.get("description", "")
    out["requirements"] = _google_translate(parsed.get("requirements", "")) or parsed.get("requirements", "")
    out["foreigner_friendly"] = friendly
    out["foreigner_note"]     = note[:300]
    return out


def _parse_job(detail: dict) -> Optional[dict]:
    """Map a Wanted detail payload onto our Job columns. Returns None if the
    posting doesn't look usable (e.g. no title or no id)."""
    if not isinstance(detail, dict):
        return None

    job_id = detail.get("id") or detail.get("job_id")
    if not job_id:
        return None

    title = _clean_text(detail.get("position") or detail.get("title"))
    if not title:
        return None

    company_obj = detail.get("company") or {}
    company = _clean_text(
        company_obj.get("name") if isinstance(company_obj, dict) else company_obj
    )

    address_obj = detail.get("address") or {}
    location = _clean_text(
        address_obj.get("location") if isinstance(address_obj, dict) else address_obj
    )

    detail_obj = detail.get("detail") or {}
    if not isinstance(detail_obj, dict):
        detail_obj = {}

    description = _join_sections(
        _clean_text(detail_obj.get("intro")),
        _clean_text(detail_obj.get("main_tasks")),
        _clean_text(detail_obj.get("benefits")),
    )

    # As of 2026 Wanted uses "requirements" inside detail.* (the original spec
    # called it "qualifications"). Accept both for safety in case it changes.
    requirements = _join_sections(
        _clean_text(detail_obj.get("requirements") or detail_obj.get("qualifications")),
        _clean_text(detail_obj.get("preferred_points")),
    )

    # Skill tags → comma-separated string (matches how Job.tags is stored)
    skill_tags = detail.get("skill_tags") or []
    tag_keywords: list[str] = []
    if isinstance(skill_tags, list):
        for tag in skill_tags:
            if isinstance(tag, dict):
                keyword = _clean_text(tag.get("keyword") or tag.get("name"))
            else:
                keyword = _clean_text(tag)
            if keyword and keyword not in tag_keywords:
                tag_keywords.append(keyword)
    tags = ", ".join(tag_keywords)

    # Deadline: Wanted returns it under several different keys depending on
    # the posting type. Try every candidate; take only the date prefix.
    raw_deadline = ""
    for k in ("deadline", "due_time", "application_deadline", "expires_at"):
        v = detail.get(k)
        if v:
            raw_deadline = _clean_text(v)
            break
    deadline = raw_deadline[:10] if raw_deadline else ""
    # When Wanted has no deadline, default to 60 days from now so the row
    # gets cleaned up automatically once it's stale.
    if not deadline:
        from datetime import datetime, timedelta
        deadline = (datetime.utcnow() + timedelta(days=60)).strftime("%Y-%m-%d")

    # Salary: try the structured "salary" object first, fall back to a few
    # numeric range fields (annual_from/annual_to are in 10,000s of KRW).
    salary = ""
    salary_obj = detail.get("salary") or {}
    if isinstance(salary_obj, dict):
        salary = _clean_text(salary_obj.get("text"))
    elif salary_obj:
        salary = _clean_text(salary_obj)
    if not salary:
        a_from = detail.get("annual_from")
        a_to = detail.get("annual_to")
        if a_from and a_to and (a_from or a_to):
            try:
                a_from_i, a_to_i = int(a_from), int(a_to)
                if a_from_i > 0 and a_to_i > 0:
                    salary = f"{a_from_i:,}–{a_to_i:,} ₩10,000/yr"
            except (TypeError, ValueError):
                pass

    apply_link = PUBLIC_URL.format(id=job_id)

    return {
        "title": title[:200],
        "company": company[:150] or "Wanted",
        "location": location[:150],
        "job_type": "internship",
        "salary": salary[:100],
        "description": description,
        "requirements": requirements,
        "visa_compatible": "D-2, D-4",
        "deadline": deadline[:50],
        "tags": tags[:300],
        "apply_link": apply_link[:500],
    }


# Main scraper ----------------------------------------------------------------

def run_scraper(app) -> dict:
    """Fetch latest Wanted internships and insert up to MAX_PER_RUN new rows.

    Returns a small summary dict (also printed) so the admin trigger can log
    what happened.
    """
    from app import db
    from models import Job

    summary = {
        "fetched": 0, "skipped_existing": 0, "skipped_invalid": 0,
        "skipped_foreign_unfriendly": 0,
        "inserted": 0, "reactivated": 0, "errors": 0,
    }

    with app.app_context():
        try:
            listings = _fetch_list()
        except Exception as e:
            print(f"[wanted] unexpected list error: {e}")
            traceback.print_exc()
            return summary

        summary["fetched"] = len(listings)
        if not listings:
            print("[wanted] no listings returned — bailing out")
            return summary

        # Snapshot only ACTIVE existing links — so deactivated rows (e.g. ones
        # the cleanup job killed for being past their deadline) don't block
        # us from re-listing them if Wanted is showing them again.
        active_links = {
            row[0] for row in db.session.query(Job.apply_link)
                .filter(Job.is_active == True, Job.apply_link.isnot(None))  # noqa: E712
                .all()
        }

        max_inserts = _max_per_run()
        inserted_links: list[str] = []
        reactivated_links: list[str] = []

        for raw in listings:
            if summary["inserted"] + summary["reactivated"] >= max_inserts:
                break

            job_id = raw.get("id") if isinstance(raw, dict) else None
            if not job_id:
                summary["skipped_invalid"] += 1
                continue

            candidate_link = PUBLIC_URL.format(id=job_id)
            if candidate_link in active_links:
                # Already live in our DB — nothing to do.
                summary["skipped_existing"] += 1
                continue

            detail = _fetch_detail(job_id)
            # Be polite — 0.3s between detail fetches to avoid hammering the API.
            time.sleep(0.3)

            if not detail:
                summary["errors"] += 1
                continue

            parsed = _parse_job(detail)
            if not parsed:
                summary["skipped_invalid"] += 1
                continue

            # Detail endpoint might have a different id than the listing — recheck.
            if parsed["apply_link"] in active_links:
                summary["skipped_existing"] += 1
                continue

            # Translate Korean → English + classify foreigner-friendly.
            # Always works: tries Groq first, falls back to Google Translate.
            parsed = _translate_with_groq(parsed)

            # Skip postings explicitly closed to foreign applicants — saves DB
            # space and prevents misleading our international-student audience.
            if (parsed.get("foreigner_friendly") or "").lower() == "no":
                summary["skipped_foreign_unfriendly"] = summary.get("skipped_foreign_unfriendly", 0) + 1
                continue

            # Is there an inactive row for this apply_link? If so, reactivate
            # it with fresh data instead of inserting a duplicate.
            try:
                existing = (
                    Job.query.filter_by(apply_link=parsed["apply_link"]).first()
                )
                if existing:
                    existing.title              = parsed["title"]
                    existing.company            = parsed["company"]
                    existing.location           = parsed["location"]
                    existing.job_type           = parsed["job_type"]
                    existing.salary             = parsed["salary"]
                    existing.description        = parsed["description"]
                    existing.requirements       = parsed["requirements"]
                    existing.visa_compatible    = parsed["visa_compatible"]
                    existing.deadline           = parsed["deadline"]
                    existing.tags               = parsed["tags"]
                    existing.foreigner_friendly = parsed.get("foreigner_friendly", "")
                    existing.foreigner_note     = parsed.get("foreigner_note", "")
                    existing.is_active          = True
                    db.session.commit()
                    active_links.add(parsed["apply_link"])
                    reactivated_links.append(parsed["apply_link"])
                    summary["reactivated"] += 1
                    continue

                # Truly new posting — insert.
                job = Job(
                    title=parsed["title"],
                    company=parsed["company"],
                    location=parsed["location"],
                    job_type=parsed["job_type"],
                    salary=parsed["salary"],
                    description=parsed["description"],
                    requirements=parsed["requirements"],
                    visa_compatible=parsed["visa_compatible"],
                    deadline=parsed["deadline"],
                    tags=parsed["tags"],
                    apply_link=parsed["apply_link"],
                    foreigner_friendly=parsed.get("foreigner_friendly", ""),
                    foreigner_note=parsed.get("foreigner_note", ""),
                    is_active=True,
                )
                db.session.add(job)
                db.session.commit()
                active_links.add(parsed["apply_link"])
                inserted_links.append(parsed["apply_link"])
                summary["inserted"] += 1
            except Exception as e:
                db.session.rollback()
                summary["errors"] += 1
                print(f"[wanted] write failed for {parsed['apply_link']}: {e}")

        print(
            f"[wanted] done — fetched={summary['fetched']} "
            f"inserted={summary['inserted']} "
            f"reactivated={summary['reactivated']} "
            f"skipped_existing={summary['skipped_existing']} "
            f"skipped_invalid={summary['skipped_invalid']} "
            f"skipped_foreign_unfriendly={summary.get('skipped_foreign_unfriendly', 0)} "
            f"errors={summary['errors']}"
        )
        if inserted_links:
            print(f"[wanted] new postings:\n  " + "\n  ".join(inserted_links))
        if reactivated_links:
            print(f"[wanted] reactivated postings:\n  " + "\n  ".join(reactivated_links))

    return summary


# Retroactive translation -----------------------------------------------------

def _looks_korean(text: str) -> bool:
    """True if the string contains any Hangul characters (Korean syllabary)."""
    if not text:
        return False
    return any("가" <= ch <= "힣" for ch in text)


def translate_pending(app, limit: int = 80) -> dict:
    """Find active job rows whose title still contains Korean OR whose
    foreigner_friendly column is empty (meaning they were scraped before
    AI translation existed) and translate them in place via Groq.

    Returns a small summary so admin trigger can display it.
    """
    from app import db
    from models import Job

    summary = {"scanned": 0, "translated": 0, "skipped": 0, "errors": 0}

    # No GROQ_API_KEY check anymore — _translate_with_groq now falls back to
    # the free Google Translate endpoint when Groq isn't configured, so this
    # function always has a working translator available.

    with app.app_context():
        # Pull at most `limit` candidates per run so we never block forever.
        rows = (
            Job.query.filter(Job.is_active == True)  # noqa: E712
            .order_by(Job.created_at.desc())
            .limit(limit)
            .all()
        )
        for job in rows:
            summary["scanned"] += 1
            needs = _looks_korean(job.title or "") or not (job.foreigner_friendly or "")
            if not needs:
                summary["skipped"] += 1
                continue

            parsed = {
                "title":        job.title or "",
                "company":      job.company or "",
                "description":  job.description or "",
                "requirements": job.requirements or "",
            }
            translated = _translate_with_groq(parsed)
            # If translate failed silently, the dict comes back unchanged with
            # foreigner_friendly == "". Count that as an error so the admin sees it.
            if (
                translated.get("title") == parsed["title"]
                and translated.get("foreigner_friendly") in ("", None)
            ):
                summary["errors"] += 1
                continue

            try:
                job.title              = translated.get("title", job.title)[:200]
                job.description        = translated.get("description", job.description)
                job.requirements       = translated.get("requirements", job.requirements)
                job.foreigner_friendly = translated.get("foreigner_friendly", "")
                job.foreigner_note     = translated.get("foreigner_note", "")[:300]
                db.session.commit()
                summary["translated"] += 1
            except Exception as e:
                db.session.rollback()
                summary["errors"] += 1
                print(f"[wanted] translate write failed for job {job.id}: {e}")

        print(
            f"[wanted] translate_pending — scanned={summary['scanned']} "
            f"translated={summary['translated']} skipped={summary['skipped']} "
            f"errors={summary['errors']}"
        )
    return summary
