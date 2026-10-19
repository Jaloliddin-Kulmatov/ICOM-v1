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

def fail(msg: str):
    """Stop with a message GitHub shows on the run page (no need to open logs)."""
    print(f"::error title=Sync internships::{msg}")
    raise SystemExit(1)


API_URL = os.environ.get("ICOM_API_URL", "").strip().rstrip("/")
SECRET = os.environ.get("SCRAPER_SECRET", "").strip()
if not API_URL:
    fail("GitHub secret ICOM_API_URL is missing or empty. Set it to https://icom-v1.onrender.com/api")
if not API_URL.startswith(("http://", "https://")):
    fail("GitHub secret ICOM_API_URL must start with https:// (e.g. https://icom-v1.onrender.com/api)")
if not API_URL.endswith("/api"):
    fail("GitHub secret ICOM_API_URL must end with /api (e.g. https://icom-v1.onrender.com/api)")
if not SECRET:
    fail("GitHub secret SCRAPER_SECRET is missing or empty. Use the same value as SCRAPER_SECRET on Render")
HEADERS = {"X-Scraper-Key": SECRET}


def call(method: str, path: str, **kw):
    """Call the backend, retrying only while a free instance wakes up."""
    last = None
    for attempt in range(6):
        try:
            r = requests.request(method, f"{API_URL}{path}", headers=HEADERS, timeout=120, **kw)
        except requests.RequestException as e:
            last = e
        else:
            # Retrying can't fix these, so say exactly what's wrong.
            if r.status_code == 401:
                fail("The backend rejected SCRAPER_SECRET (401). The GitHub secret and the "
                     "SCRAPER_SECRET env var on Render must be exactly the same, and Render must be redeployed after setting it")
            if r.status_code == 404:
                fail(f"{API_URL}{path} was not found (404). Check that ICOM_API_URL points at the backend and ends with /api")
            if r.status_code < 500:
                r.raise_for_status()
                return r.json()
            last = f"HTTP {r.status_code}"
        print(f"[icom] {method} {path} failed ({last}); retrying in 20s")
        time.sleep(20)
    fail(f"Backend didn't answer {method} {path} after 6 tries: {last}")


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
    result = call("POST", "/admin/jobs/sync",
                  json={"upsert": plan["upsert"], "close": plan["close"],
                        "seen": plan.get("seen", []), "deadlines": plan.get("deadlines", {})})
    print(f"[icom] applied: {result}")


if __name__ == "__main__":
    main()
