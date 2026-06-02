"""
Saramin (사람인) internship scraper — via the official Saramin Open API.

Why the official API and not HTML scraping?
  Saramin publishes a free, ToS-compliant Open API that returns job postings as
  JSON. That is far more reliable than scraping HTML (which breaks on redesigns
  and gets a datacenter IP blocked). It does require a free access key.

Setup (one-time):
  1. Register at  https://oapi.saramin.co.kr  and create an application.
  2. Copy the access key.
  3. On Render add an environment variable:  SARAMIN_API_KEY = <your key>

If SARAMIN_API_KEY is NOT set, this scraper is a safe no-op — it logs a notice
and returns an empty summary, so it never breaks the Wanted scrape.

Env vars:
  SARAMIN_API_KEY   — required to enable this source
  SARAMIN_QUERY     — search keyword (default: "인턴" = "intern")
  SARAMIN_LIMIT     — how many listings to request (default: 60, API max 110)
  SARAMIN_MAX_PER_RUN — max new rows to insert per run (default: 25)
"""

import os
import time
import traceback
from typing import Optional

import requests

# Reuse Wanted's translation + text helpers so both sources behave identically.
from scrapers.wanted import _translate_with_groq, _clean_text

API_URL = "https://oapi.saramin.co.kr/job-search"

HEADERS = {
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (ICOM job aggregator)",
}


# ── Config helpers ────────────────────────────────────────────────────────────
def _api_key() -> str:
    return os.environ.get("SARAMIN_API_KEY", "").strip()


def _query() -> str:
    return os.environ.get("SARAMIN_QUERY", "인턴")


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


def _limit() -> int:
    return min(_env_int("SARAMIN_LIMIT", 60), 110)   # API caps at 110


def _max_per_run() -> int:
    return _env_int("SARAMIN_MAX_PER_RUN", 25)


# ── Fetch ─────────────────────────────────────────────────────────────────────
def _fetch_list() -> list:
    """Call the Saramin Open API and return the list of job objects."""
    params = {
        "access-key": _api_key(),
        "keywords": _query(),
        "count": _limit(),
        "sort": "pd",                      # posting date, newest first
        "fields": "posting-date+expiration-date+keyword-code+count",
    }
    try:
        resp = requests.get(API_URL, params=params, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"[saramin] list fetch failed: {e}")
        return []

    # Response shape: {"jobs": {"count":N, "job":[ {...}, ... ]}}
    jobs = (data or {}).get("jobs", {})
    arr = jobs.get("job", []) if isinstance(jobs, dict) else []
    return arr if isinstance(arr, list) else []


# ── Parse one Saramin job object into our Job columns ──────────────────────────
def _parse_job(job: dict) -> Optional[dict]:
    if not isinstance(job, dict):
        return None

    apply_link = _clean_text(job.get("url"))
    if not apply_link:
        return None

    position = job.get("position") or {}
    if not isinstance(position, dict):
        position = {}

    title = _clean_text(position.get("title"))
    if not title:
        return None

    company_obj = job.get("company") or {}
    company_detail = company_obj.get("detail", {}) if isinstance(company_obj, dict) else {}
    company = _clean_text(company_detail.get("name")) if isinstance(company_detail, dict) else ""

    def _name(obj_key: str) -> str:
        o = position.get(obj_key) or {}
        return _clean_text(o.get("name")) if isinstance(o, dict) else ""

    location   = _name("location")
    job_type   = _name("job-type")
    experience = _name("experience-level")
    education  = _name("required-education-level")
    industry   = _name("industry")

    salary_obj = job.get("salary") or {}
    salary = _clean_text(salary_obj.get("name")) if isinstance(salary_obj, dict) else ""

    keyword = _clean_text(job.get("keyword"))

    # Saramin's API doesn't return the full posting body, so we synthesize a
    # short description from the structured fields. It gets translated below.
    desc_parts = []
    if industry:   desc_parts.append(f"산업: {industry}")
    if job_type:   desc_parts.append(f"고용형태: {job_type}")
    if experience: desc_parts.append(f"경력: {experience}")
    if salary:     desc_parts.append(f"급여: {salary}")
    description = " · ".join(desc_parts) or title

    requirements = ""
    if education:  requirements += f"학력: {education}\n"
    if experience: requirements += f"경력: {experience}\n"
    requirements = requirements.strip()

    # Deadline from expiration-timestamp (unix seconds) → YYYY-MM-DD.
    deadline = ""
    exp = job.get("expiration-timestamp")
    try:
        if exp:
            deadline = time.strftime("%Y-%m-%d", time.localtime(int(exp)))
    except (TypeError, ValueError):
        deadline = ""

    tags = ", ".join([t for t in [keyword, industry] if t])[:300]

    return {
        "title": title[:200],
        "company": company[:150] or "Saramin",
        "location": location[:150],
        "job_type": "internship",
        "salary": salary[:100],
        "description": description,
        "requirements": requirements,
        "visa_compatible": "D-2, D-4",
        "deadline": deadline[:50],
        "tags": tags,
        "apply_link": apply_link[:500],
    }


# ── Main scraper ───────────────────────────────────────────────────────────────
def run_scraper(app) -> dict:
    """Fetch latest Saramin internships and insert up to MAX_PER_RUN new rows.
    Mirrors the Wanted scraper: dedupe by apply_link, translate, skip postings
    explicitly closed to foreigners. Safe no-op when no API key is configured.
    """
    from app import db
    from models import Job

    summary = {
        "fetched": 0, "skipped_existing": 0, "skipped_invalid": 0,
        "skipped_foreign_unfriendly": 0,
        "inserted": 0, "reactivated": 0, "errors": 0,
    }

    if not _api_key():
        print("[saramin] SARAMIN_API_KEY not set → skipping (no-op). "
              "Register a free key at https://oapi.saramin.co.kr to enable.")
        return summary

    with app.app_context():
        try:
            listings = _fetch_list()
        except Exception as e:
            print(f"[saramin] unexpected list error: {e}")
            traceback.print_exc()
            return summary

        summary["fetched"] = len(listings)
        if not listings:
            print("[saramin] no listings returned — bailing out")
            return summary

        active_links = {
            row[0] for row in db.session.query(Job.apply_link)
            .filter(Job.is_active == True, Job.apply_link.isnot(None))  # noqa: E712
            .all()
        }

        max_inserts = _max_per_run()
        inserted_links: list[str] = []

        for raw in listings:
            if summary["inserted"] + summary["reactivated"] >= max_inserts:
                break

            parsed = _parse_job(raw)
            if not parsed:
                summary["skipped_invalid"] += 1
                continue

            if parsed["apply_link"] in active_links:
                summary["skipped_existing"] += 1
                continue

            # Translate Korean → English + classify foreigner-friendliness.
            parsed = _translate_with_groq(parsed)

            if (parsed.get("foreigner_friendly") or "").lower() == "no":
                summary["skipped_foreign_unfriendly"] += 1
                continue

            try:
                existing = Job.query.filter_by(apply_link=parsed["apply_link"]).first()
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
                    summary["reactivated"] += 1
                    continue

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
                print(f"[saramin] write failed for {parsed['apply_link']}: {e}")

        print(
            f"[saramin] done — fetched={summary['fetched']} "
            f"inserted={summary['inserted']} reactivated={summary['reactivated']} "
            f"skipped_existing={summary['skipped_existing']} "
            f"skipped_invalid={summary['skipped_invalid']} "
            f"skipped_foreign_unfriendly={summary['skipped_foreign_unfriendly']} "
            f"errors={summary['errors']}"
        )
        if inserted_links:
            print("[saramin] new postings:\n  " + "\n  ".join(inserted_links))

    return summary
