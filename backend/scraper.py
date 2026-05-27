"""
Internship scraper — runs inside the Flask process via APScheduler.
Scrapes Wanted.co.kr and writes directly to the Job table.

Environment variables (optional):
  WANTED_QUERY   - search keyword (default: 인턴)
  WANTED_LIMIT   - listings to fetch per run (default: 40)
  MAX_PER_RUN    - max new jobs to insert per run (default: 15)
"""

import os
import time
import requests

WANTED_QUERY = os.environ.get("WANTED_QUERY", "인턴")
WANTED_LIMIT = int(os.environ.get("WANTED_LIMIT", 40))
MAX_PER_RUN  = int(os.environ.get("MAX_PER_RUN", 15))

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; ICOM-scraper/1.0)",
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://www.wanted.co.kr/",
}


def _get(url, params=None, timeout=10):
    try:
        r = requests.get(url, params=params, headers=HEADERS, timeout=timeout)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"[scraper] GET {url} failed: {e}")
        return None


def _fetch_listings() -> list[dict]:
    data = _get(
        "https://www.wanted.co.kr/api/v4/jobs",
        params={
            "job_sort": "job.latest_order",
            "locations": "all",
            "years": -1,
            "query": WANTED_QUERY,
            "limit": WANTED_LIMIT,
            "offset": 0,
        },
        timeout=15,
    )
    return (data or {}).get("data", [])


def _fetch_detail(job_id: int) -> dict:
    data = _get(f"https://www.wanted.co.kr/api/v4/jobs/{job_id}")
    return (data or {}).get("job", {})


def _parse(item: dict, detail: dict) -> dict:
    jid = item.get("id", 0)

    title   = (detail.get("position") or item.get("position") or "Internship").strip()
    company = (
        (detail.get("company") or {}).get("name")
        or (item.get("company") or {}).get("name")
        or "Unknown"
    ).strip()

    address  = detail.get("address") or item.get("address") or {}
    location = (address.get("location") or address.get("full_location") or "Korea").strip()

    d = detail.get("detail") or {}
    description = "\n\n".join(
        p.strip() for p in [d.get("intro") or "", d.get("main_tasks") or "", d.get("benefits") or ""]
        if p.strip()
    )
    requirements = "\n".join(
        r.strip() for r in [d.get("qualifications") or "", d.get("preferred_points") or ""]
        if r.strip()
    )

    skill_tags = detail.get("skill_tags") or []
    tags = ", ".join(t.get("keyword", "") for t in skill_tags[:8] if t.get("keyword"))

    deadline = (detail.get("deadline") or item.get("deadline") or "").strip()
    if deadline and "T" in deadline:
        deadline = deadline.split("T")[0]

    salary = detail.get("salary") or {}
    salary = salary.get("text", "") if isinstance(salary, dict) else str(salary)

    return {
        "title": title,
        "company": company,
        "location": location,
        "job_type": "internship",
        "salary": salary.strip(),
        "description": description,
        "requirements": requirements,
        "visa_compatible": "D-2, D-4",
        "deadline": deadline,
        "tags": tags,
        "apply_link": f"https://www.wanted.co.kr/wd/{jid}",
    }


def run_scraper(app):
    """Called by APScheduler — runs inside Flask app context."""
    with app.app_context():
        from app import db
        from models import Job

        print(f"[scraper] starting — query='{WANTED_QUERY}' limit={WANTED_LIMIT}")

        listings = _fetch_listings()
        print(f"[scraper] fetched {len(listings)} listings from Wanted")

        if not listings:
            return

        # One query to get all existing apply_links for deduplication
        existing_links = {
            row[0]
            for row in db.session.query(Job.apply_link).filter(Job.apply_link.isnot(None)).all()
        }

        inserted = 0
        for item in listings:
            if inserted >= MAX_PER_RUN:
                break
            jid = item.get("id")
            if not jid:
                continue

            apply_link = f"https://www.wanted.co.kr/wd/{jid}"
            if apply_link in existing_links:
                continue

            detail = _fetch_detail(jid)
            if not detail:
                continue

            parsed = _parse(item, detail)
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
            )
            db.session.add(job)
            existing_links.add(apply_link)
            inserted += 1
            time.sleep(0.3)

        db.session.commit()
        print(f"[scraper] done — inserted {inserted} new internships")
