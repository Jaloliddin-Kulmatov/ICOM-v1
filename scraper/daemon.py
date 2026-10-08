"""
ICOM internship sync (runs in GitHub Actions twice a day).

1. Asks the backend which Wanted jobs it already has (GET /admin/jobs/sync-state).
2. Adds new Wanted internships, translated to English and checked for
   foreigner-friendliness (Groq, falling back to Google Translate).
3. Rechecks every live job against Wanted: closed or past-deadline postings
   are hidden, and any still in Korean get translated.
4. Sends the result to POST /admin/jobs/sync in one request.

Environment:
  ICOM_API_URL      e.g. https://icom-v1.onrender.com/api   (required)
  SCRAPER_SECRET    same value as on the backend              (required)
  GROQ_API_KEY      optional; without it Google Translate is used
  WANTED_QUERY      search keyword (default: 인턴)
  WANTED_PAGES      listing pages of 100 to scan (default: 2)
  NEW_LIMIT         max new/reopened postings per run (default: 40)
  TRANSLATE_LIMIT   max translations per run (default: 60)
  TIME_BUDGET_MIN   stop starting new work after this many minutes (default: 20)
"""
import os
import sys
import time

import requests

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend"))
from scrapers.sync import build_plan  # noqa: E402

API_URL = os.environ["ICOM_API_URL"].rstrip("/")
HEADERS = {"X-Scraper-Key": os.environ["SCRAPER_SECRET"]}


def call(method: str, path: str, **kw):
    """Call the backend, retrying while a free instance wakes up."""
    last = None
    for attempt in range(6):
        try:
            r = requests.request(method, f"{API_URL}{path}", headers=HEADERS, timeout=120, **kw)
            if r.status_code in (502, 503, 504):
                raise RuntimeError(f"HTTP {r.status_code}")
            r.raise_for_status()
            return r.json()
        except Exception as e:
            last = e
            print(f"[icom] {method} {path} failed ({e}); retrying in 20s")
            time.sleep(20)
    raise SystemExit(f"[icom] giving up on {method} {path}: {last}")


def main():
    state = call("GET", "/admin/jobs/sync-state")
    known = {j["link"]: j for j in state.get("jobs", [])}
    print(f"[icom] backend knows {len(known)} Wanted jobs "
          f"({sum(1 for j in known.values() if j['active'])} live)")

    plan = build_plan(
        known,
        query=os.environ.get("WANTED_QUERY", "인턴"),
        pages=int(os.environ.get("WANTED_PAGES", 2)),
        new_limit=int(os.environ.get("NEW_LIMIT", 40)),
        translate_limit=int(os.environ.get("TRANSLATE_LIMIT", 60)),
        time_budget_s=int(float(os.environ.get("TIME_BUDGET_MIN", 20)) * 60),
    )
    if not plan["upsert"] and not plan["close"]:
        print("[icom] nothing to change")
    result = call("POST", "/admin/jobs/sync", json={"upsert": plan["upsert"], "close": plan["close"]})
    print(f"[icom] applied: {result}")


if __name__ == "__main__":
    main()
