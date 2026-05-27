"""
ICOM Internship Scraper
Scrapes Wanted.co.kr for Korean internship listings and posts new ones
to the ICOM backend via /api/admin/jobs/bulk-ingest.

Environment variables required:
  ICOM_API_URL     - e.g. https://icom-backend.onrender.com/api
  SCRAPER_SECRET   - matches SCRAPER_SECRET on the backend

Optional:
  MAX_PER_RUN      - max jobs to insert per run (default: 15)
  WANTED_QUERY     - search query (default: 인턴)
  WANTED_LIMIT     - listings to fetch from Wanted (default: 40)
"""

import os
import sys
import time
import requests

API_URL       = os.environ["ICOM_API_URL"].rstrip("/")
SCRAPER_KEY   = os.environ["SCRAPER_SECRET"]
MAX_PER_RUN   = int(os.environ.get("MAX_PER_RUN", 15))
WANTED_QUERY  = os.environ.get("WANTED_QUERY", "인턴")
WANTED_LIMIT  = int(os.environ.get("WANTED_LIMIT", 40))

WANTED_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; ICOM-scraper/1.0)",
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://www.wanted.co.kr/",
}

session = requests.Session()
session.headers.update(WANTED_HEADERS)


def fetch_wanted_list() -> list[dict]:
    url = "https://www.wanted.co.kr/api/v4/jobs"
    params = {
        "job_sort": "job.latest_order",
        "locations": "all",
        "years": -1,
        "query": WANTED_QUERY,
        "limit": WANTED_LIMIT,
        "offset": 0,
    }
    try:
        r = session.get(url, params=params, timeout=15)
        r.raise_for_status()
        return r.json().get("data", [])
    except Exception as e:
        print(f"[wanted] list fetch failed: {e}")
        return []


def fetch_wanted_detail(job_id: int) -> dict | None:
    url = f"https://www.wanted.co.kr/api/v4/jobs/{job_id}"
    try:
        r = session.get(url, timeout=10)
        r.raise_for_status()
        return r.json().get("job", {})
    except Exception as e:
        print(f"[wanted] detail fetch failed id={job_id}: {e}")
        return None


def parse_wanted_job(item: dict, detail: dict) -> dict:
    jid = item.get("id", 0)

    title   = (detail.get("position") or item.get("position") or "").strip()
    company = (
        (detail.get("company") or {}).get("name")
        or (item.get("company") or {}).get("name")
        or ""
    ).strip()

    # Location
    address = detail.get("address") or item.get("address") or {}
    location = (address.get("location") or address.get("full_location") or "Korea").strip()

    # Description: combine intro + main_tasks
    d = detail.get("detail") or {}
    parts = [
        d.get("intro") or "",
        d.get("main_tasks") or "",
        d.get("benefits") or "",
    ]
    description = "\n\n".join(p.strip() for p in parts if p.strip())

    # Requirements
    req_parts = [
        d.get("qualifications") or "",
        d.get("preferred_points") or "",
    ]
    requirements = "\n".join(r.strip() for r in req_parts if r.strip())

    # Tags from skill_tags
    skill_tags = detail.get("skill_tags") or []
    tags = ", ".join(t.get("keyword", "") for t in skill_tags[:8] if t.get("keyword"))

    # Deadline
    deadline = (detail.get("deadline") or item.get("deadline") or "").strip()
    if deadline and "T" in deadline:
        deadline = deadline.split("T")[0]  # keep date only

    # Salary
    salary = (detail.get("salary") or {})
    if isinstance(salary, dict):
        salary = salary.get("text") or ""
    salary = str(salary).strip()

    apply_link = f"https://www.wanted.co.kr/wd/{jid}"

    return {
        "title": title or "Internship",
        "company": company or "Unknown",
        "location": location,
        "type": "internship",
        "salary": salary,
        "description": description,
        "requirements": requirements,
        "visa_compatible": "D-2, D-4",
        "deadline": deadline,
        "tags": tags,
        "apply_link": apply_link,
    }


def post_to_icom(jobs: list[dict]) -> tuple[int, int]:
    if not jobs:
        return 0, 0
    try:
        r = requests.post(
            f"{API_URL}/admin/jobs/bulk-ingest",
            json={"jobs": jobs},
            headers={"X-Scraper-Key": SCRAPER_KEY},
            timeout=30,
        )
        r.raise_for_status()
        data = r.json()
        return data.get("inserted", 0), data.get("skipped", 0)
    except Exception as e:
        print(f"[icom] bulk-ingest failed: {e}")
        return 0, 0


def main():
    print(f"[scraper] starting — query='{WANTED_QUERY}' limit={WANTED_LIMIT} max_per_run={MAX_PER_RUN}")

    listings = fetch_wanted_list()
    print(f"[wanted] fetched {len(listings)} listings")

    jobs = []
    for item in listings:
        if len(jobs) >= MAX_PER_RUN:
            break
        jid = item.get("id")
        if not jid:
            continue
        detail = fetch_wanted_detail(jid)
        if not detail:
            continue
        jobs.append(parse_wanted_job(item, detail))
        time.sleep(0.3)  # be polite to Wanted's API

    print(f"[scraper] parsed {len(jobs)} jobs, posting to ICOM...")
    inserted, skipped = post_to_icom(jobs)
    print(f"[scraper] done — inserted={inserted} skipped={skipped}")


if __name__ == "__main__":
    main()
