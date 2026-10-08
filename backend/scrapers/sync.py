"""Internship sync: decide what to add, refresh and close, without touching the DB.

Used by scraper/daemon.py (GitHub Actions). The runner has time and a normal IP,
so it does the slow parts (Wanted API calls, translation) and then sends one
batch to POST /api/admin/jobs/sync, which applies it to the database.

    plan = build_plan(known, ...)
    -> {"upsert": [job dicts], "close": [apply_links], "stats": {...}}

`known` maps apply_link -> {"active": bool, "korean": bool} for every Wanted
job the backend already has (from GET /api/admin/jobs/sync-state).
"""
from __future__ import annotations

import os
import time
from datetime import date
from typing import Callable, Optional

import requests

from scrapers.wanted import (
    HEADERS, LIST_URL, PUBLIC_URL,
    _fetch_detail, _parse_job, _translate_with_groq, _looks_korean,
)


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


def fetch_listings(query: str, pages: int, per_page: int = 100) -> list[dict]:
    """Newest Wanted listings for `query`, across a few pages."""
    out: list[dict] = []
    for page in range(pages):
        params = {
            "country": os.environ.get("WANTED_COUNTRY", "kr"),
            "query": query, "limit": per_page, "offset": page * per_page,
            "job_sort": "job.latest_order", "locations": "all", "years": -1,
        }
        try:
            res = requests.get(LIST_URL, params=params, headers=HEADERS, timeout=20)
            res.raise_for_status()
            data = res.json().get("data") or []
        except Exception as e:
            print(f"[sync] list page {page} failed: {e}")
            break
        out.extend(d for d in data if isinstance(d, dict) and d.get("id"))
        if len(data) < per_page:
            break
        time.sleep(0.3)
    return out


def _link_id(link: str) -> Optional[str]:
    tail = (link or "").rstrip("/").rsplit("/", 1)[-1]
    return tail if tail.isdigit() else None


def _is_open(detail: dict) -> bool:
    """Wanted marks finished postings with status "close" (and some get hidden)."""
    status = (detail.get("status") or "").lower()
    if detail.get("hidden"):
        return False
    return status in ("", "active", "open")


def _past_deadline(deadline: str) -> bool:
    raw = (deadline or "").strip()[:10]
    if len(raw) != 10:
        return False
    try:
        return date.fromisoformat(raw) < date.today()
    except ValueError:
        return False


def build_plan(
    known: dict[str, dict],
    query: str = "인턴",
    pages: int = 2,
    new_limit: int = 40,
    translate_limit: int = 60,
    time_budget_s: int = 20 * 60,
    log: Callable[[str], None] = print,
) -> dict:
    started = time.time()
    out_of_time = lambda: time.time() - started > time_budget_s  # noqa: E731
    stats = {"listed": 0, "new": 0, "reopened": 0, "refreshed": 0, "closed": 0,
             "skipped_no_foreigners": 0, "translated": 0, "deferred": 0, "errors": 0}
    upsert: list[dict] = []
    close: list[str] = []
    translations_left = translate_limit

    DEFER = object()  # still Korean: try again next run instead of listing it

    def prepare(detail: dict):
        """Parse + translate one posting. None = don't list it, DEFER = later."""
        nonlocal translations_left
        parsed = _parse_job(detail)
        if not parsed:
            return None
        korean = lambda p: _looks_korean(p["title"]) or _looks_korean(p["description"])  # noqa: E731
        if korean(parsed):
            if translations_left <= 0:
                stats["deferred"] += 1
                return DEFER
            parsed = _translate_with_groq(parsed)
            translations_left -= 1
            if korean(parsed):
                stats["deferred"] += 1
                return DEFER
            stats["translated"] += 1
        if (parsed.get("foreigner_friendly") or "").lower() == "no":
            stats["skipped_no_foreigners"] += 1
            return None
        return parsed

    # 1) New postings from the latest listings ------------------------------------
    listings = fetch_listings(query, pages)
    stats["listed"] = len(listings)
    seen_links = set()
    for item in listings:
        link = PUBLIC_URL.format(id=item["id"])
        seen_links.add(link)
        info = known.get(link)
        if info and info.get("active") and not info.get("korean"):
            continue  # already live and in English; the recheck below keeps it honest
        if stats["new"] + stats["reopened"] >= new_limit or out_of_time() or translations_left <= 0:
            continue  # Wanted postings are Korean, so no translation budget = nothing to add
        detail = _fetch_detail(item["id"])
        time.sleep(0.25)
        if not detail:
            stats["errors"] += 1
            continue
        if not _is_open(detail):
            if info and info.get("active"):
                close.append(link)
                stats["closed"] += 1
            continue
        parsed = prepare(detail)
        if parsed is DEFER:
            continue
        if parsed is None:
            if info and info.get("active"):
                close.append(link)
                stats["closed"] += 1
            continue
        upsert.append(parsed)
        stats["reopened" if info else "new"] += 1

    # 2) Recheck every live posting we already show --------------------------------
    handled = {j["apply_link"] for j in upsert} | set(close)
    for link, info in known.items():
        if not info.get("active") or link in handled:
            continue
        if out_of_time():
            log("[sync] time budget reached; remaining rechecks wait for the next run")
            break
        if _past_deadline(info.get("deadline", "")):
            close.append(link)
            stats["closed"] += 1
            continue
        jid = _link_id(link)
        if not jid:
            continue
        detail = _fetch_detail(jid)
        time.sleep(0.25)
        if detail is None:
            stats["errors"] += 1
            continue
        if not _is_open(detail):
            close.append(link)
            stats["closed"] += 1
            continue
        if info.get("korean") and translations_left > 0:
            parsed = prepare(detail)
            if parsed is DEFER:
                continue
            if parsed is None:
                close.append(link)
                stats["closed"] += 1
            else:
                upsert.append(parsed)
                stats["refreshed"] += 1

    log(f"[sync] plan: {stats}")
    return {"upsert": upsert, "close": close, "stats": stats}
