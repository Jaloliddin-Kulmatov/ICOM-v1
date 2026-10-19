"""Internships close on their deadline (Korea time), when the source closes or
deletes them, or after going unconfirmed too long, and are deleted later."""
from datetime import date, datetime, timedelta

import pytest

import job_lifecycle
from app import db
from models import Job

SCRAPER = {"X-Scraper-Key": "test-scraper"}


def _make(app, link, **kw):
    with app.app_context():
        j = Job(title=kw.pop("title", "Intern"), company="Co", apply_link=link, **kw)
        db.session.add(j)
        db.session.commit()
        return j.id


def _get(app, jid):
    with app.app_context():
        j = db.session.get(Job, jid)
        return None if j is None else {"active": j.is_active, "closed_at": j.closed_at, "checked_at": j.checked_at}


def _listed_ids(client):
    return {j["id"] for j in client.get("/api/admin/jobs").get_json()["jobs"]}


def _bust():
    from routes.admin import _cache_bust
    _cache_bust("jobs_list")


def test_deadline_uses_korea_time(monkeypatch):
    # 21:00 UTC on 18 Oct is already 19 Oct in Korea: an 18 Oct deadline has passed.
    monkeypatch.setattr(job_lifecycle, "kst_today", lambda: date(2026, 10, 19))
    assert job_lifecycle.deadline_passed("2026-10-18") is True
    assert job_lifecycle.deadline_passed("2026-10-19") is False   # open all of its last day
    assert job_lifecycle.deadline_passed("") is False              # rolling
    assert job_lifecycle.deadline_passed("Open") is False


def test_listing_hides_past_deadline_and_stale(app, client):
    today = job_lifecycle.kst_today()
    old = datetime.utcnow() - timedelta(days=job_lifecycle.STALE_DAYS + 1)
    past = _make(app, "https://x.test/past", deadline=(today - timedelta(days=1)).isoformat())
    due_today = _make(app, "https://x.test/today", deadline=today.isoformat())
    stale = _make(app, "https://x.test/stale", deadline="", created_at=old)
    rechecked = _make(app, "https://x.test/rechecked", deadline="", created_at=old,
                      checked_at=datetime.utcnow() - timedelta(days=2))
    _bust()
    ids = _listed_ids(client)
    assert past not in ids and stale not in ids
    assert due_today in ids and rechecked in ids
    assert client.get(f"/api/admin/jobs/{stale}").status_code == 404


def test_sweep_closes_then_deletes(app):
    today = job_lifecycle.kst_today()
    old = datetime.utcnow() - timedelta(days=job_lifecycle.STALE_DAYS + 1)
    expired = _make(app, "https://x.test/sw-expired", deadline=(today - timedelta(days=3)).isoformat())
    stale = _make(app, "https://x.test/sw-stale", created_at=old)
    long_closed = _make(app, "https://x.test/sw-long", is_active=False,
                        closed_at=datetime.utcnow() - timedelta(days=job_lifecycle.PURGE_DAYS + 1))
    recently_closed = _make(app, "https://x.test/sw-recent", is_active=False,
                            closed_at=datetime.utcnow() - timedelta(days=5))
    with app.app_context():
        result = job_lifecycle.sweep()
    assert result["expired"] >= 1 and result["stale"] >= 1 and result["deleted"] >= 1
    assert _get(app, expired)["active"] is False and _get(app, expired)["closed_at"] is not None
    assert _get(app, stale)["active"] is False
    assert _get(app, long_closed) is None            # deleted for good
    assert _get(app, recently_closed) is not None    # kept until 30 days


def test_sync_close_seen_and_reopen(app, client):
    old = datetime.utcnow() - timedelta(days=10)
    a = _make(app, "https://www.wanted.co.kr/wd/970001", checked_at=old)
    b = _make(app, "https://www.wanted.co.kr/wd/970002", checked_at=old)
    r = client.post("/api/admin/jobs/sync", headers=SCRAPER, json={
        "close": ["https://www.wanted.co.kr/wd/970001"],
        "seen": ["https://www.wanted.co.kr/wd/970002"],
        "deadlines": {"https://www.wanted.co.kr/wd/970002": "2099-12-31"}})
    assert r.status_code == 200, r.get_json()
    body = r.get_json()
    assert body["closed"] == 1 and body["confirmed"] == 1 and body["deadlines_updated"] == 1
    with app.app_context():
        assert db.session.get(Job, b).deadline == "2099-12-31"
    assert _get(app, a)["active"] is False and _get(app, a)["closed_at"] is not None
    assert _get(app, b)["checked_at"] > old
    # Reposted on Wanted → reopened, and the deletion countdown is cancelled.
    client.post("/api/admin/jobs/sync", headers=SCRAPER, json={"upsert": [{
        "apply_link": "https://www.wanted.co.kr/wd/970001", "title": "Intern", "company": "Co"}]})
    assert _get(app, a)["active"] is True and _get(app, a)["closed_at"] is None


def test_admin_delete_starts_deletion_countdown(app, admin):
    jid = admin.post("/api/admin/jobs", json={"title": "Temp", "company": "Co"}).get_json()["job"]["id"]
    assert admin.delete(f"/api/admin/jobs/{jid}").status_code == 200
    assert _get(app, jid)["closed_at"] is not None


def test_build_plan_closes_deleted_and_reports_open(monkeypatch):
    from scrapers import sync
    monkeypatch.setattr(sync, "fetch_listings", lambda *a, **k: [])
    monkeypatch.setattr(sync.time, "sleep", lambda s: None)
    future = (job_lifecycle.kst_today() + timedelta(days=20)).isoformat()
    answers = {"1": sync.MISSING, "2": {"status": "active"}, "3": {"status": "close"}, "4": None,
               "5": {"status": "active", "due_time": f"{future}T23:59:59"},
               "6": {"status": "active", "due_time": "2026-01-31T23:59:59"}}
    monkeypatch.setattr(sync, "_check_detail", lambda jid: answers[jid])
    known = {f"https://www.wanted.co.kr/wd/{i}": {"active": True, "korean": False, "deadline": ""}
             for i in "123456"}
    plan = sync.build_plan(known, new_limit=0, translate_limit=0)
    link = "https://www.wanted.co.kr/wd/"
    assert set(plan["close"]) == {link + "1", link + "3", link + "6"}   # deleted, closed, past due
    assert plan["seen"] == [link + "2", link + "5"]
    assert plan["deadlines"] == {link + "5": future}                    # deadline added later
    assert plan["stats"]["errors"] == 1   # network hiccup: left alone, not closed


def test_backend_daily_check_closes_ended_jobs(app, monkeypatch):
    import app as app_module
    from scrapers import sync
    gone = _make(app, "https://www.wanted.co.kr/wd/910001")
    alive = _make(app, "https://www.wanted.co.kr/wd/910002",
                  checked_at=datetime.utcnow() - timedelta(days=20))

    def fake_plan(known, **kw):
        assert kw["new_limit"] == 0                    # verify only, never adds
        return {"upsert": [], "close": ["https://www.wanted.co.kr/wd/910001"],
                "seen": ["https://www.wanted.co.kr/wd/910002"], "deadlines": {}, "stats": {}}
    monkeypatch.setattr(sync, "build_plan", fake_plan)
    app_module._verify_jobs_on_wanted(app)
    assert _get(app, gone)["active"] is False
    assert _get(app, alive)["checked_at"] > datetime.utcnow() - timedelta(minutes=1)
