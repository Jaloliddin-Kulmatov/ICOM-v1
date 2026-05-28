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
    return _env_int("WANTED_LIMIT", 40)


def _max_per_run() -> int:
    return _env_int("MAX_PER_RUN", 15)


# HTTP helpers ----------------------------------------------------------------

def _fetch_list() -> list[dict]:
    """Fetch the list page; return the raw items array (may be empty on error)."""
    params = {
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

    requirements = _join_sections(
        _clean_text(detail_obj.get("qualifications")),
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

    # Deadline: take only the date prefix in case Wanted returns ISO datetime
    raw_deadline = _clean_text(detail.get("deadline"))
    deadline = raw_deadline[:10] if raw_deadline else ""

    salary_obj = detail.get("salary") or {}
    salary = _clean_text(
        salary_obj.get("text") if isinstance(salary_obj, dict) else salary_obj
    )

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
        "inserted": 0, "errors": 0,
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

        # One-shot lookup of every apply_link we already have, so dedup is O(1)
        # rather than N queries.
        existing_links = {
            row[0] for row in db.session.query(Job.apply_link).all() if row[0]
        }

        max_inserts = _max_per_run()
        inserted_links: list[str] = []

        for raw in listings:
            if summary["inserted"] >= max_inserts:
                break

            job_id = raw.get("id") if isinstance(raw, dict) else None
            if not job_id:
                summary["skipped_invalid"] += 1
                continue

            candidate_link = PUBLIC_URL.format(id=job_id)
            if candidate_link in existing_links:
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

            # Re-check apply_link in case detail endpoint returned a different id.
            if parsed["apply_link"] in existing_links:
                summary["skipped_existing"] += 1
                continue

            try:
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
                    is_active=True,
                )
                db.session.add(job)
                db.session.commit()
                existing_links.add(parsed["apply_link"])
                inserted_links.append(parsed["apply_link"])
                summary["inserted"] += 1
            except Exception as e:
                db.session.rollback()
                summary["errors"] += 1
                print(f"[wanted] insert failed for {parsed['apply_link']}: {e}")

        print(
            f"[wanted] done — fetched={summary['fetched']} "
            f"inserted={summary['inserted']} "
            f"skipped_existing={summary['skipped_existing']} "
            f"skipped_invalid={summary['skipped_invalid']} "
            f"errors={summary['errors']}"
        )
        if inserted_links:
            print(f"[wanted] new postings:\n  " + "\n  ".join(inserted_links))

    return summary
