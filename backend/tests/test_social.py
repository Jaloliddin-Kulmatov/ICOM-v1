"""The daily opportunities post to Telegram."""
from datetime import datetime, timedelta
from types import SimpleNamespace

import pytest

import social
from app import db
from models import Job, SocialPost


@pytest.fixture
def telegram(app, monkeypatch):
    """A fake Telegram API, a clean slate of postings, and the settings filled in."""
    sent, fail = [], []

    def post(url, data=None, **kw):
        sent.append((url, data))
        ok = not fail
        return SimpleNamespace(status_code=200 if ok else 400, headers={"content-type": "application/json"},
                               json=lambda: {"ok": ok, "description": "Bad Request: chat not found"})

    monkeypatch.setattr(social.requests, "post", post)
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "123:abc")
    monkeypatch.setenv("TELEGRAM_CHANNEL_ID", "@icomtest")
    with app.app_context():
        now = datetime.utcnow()
        Job.query.update({Job.posted_at: now})      # everything older counts as already posted
        SocialPost.query.delete()
        db.session.commit()
        yield SimpleNamespace(sent=sent, fail=fail)


def _add(title, kind, **kw):
    j = Job(title=title, company=kw.pop("company", "Org"), job_type=kind, is_active=True, **kw)
    db.session.add(j)
    db.session.commit()
    return j


def test_posts_new_items_once_scholarships_first(telegram):
    intern = _add("Data intern", "internship")
    scholar = _add("Excellence <scholarship>", "scholarship", salary="50% tuition",
                   deadline=(datetime.utcnow() + timedelta(days=10)).strftime("%Y-%m-%d"))
    assert social.run() == {"status": "posted", "items": 2, "error": ""}

    url, data = telegram.sent[0]
    assert url == "https://api.telegram.org/bot123:abc/sendMessage" and data["chat_id"] == "@icomtest"
    text = data["text"]
    assert text.index("Excellence") < text.index("Data intern")        # scholarships before internships
    assert "&lt;scholarship&gt;" in text                                 # titles are escaped for HTML
    assert f"/internships/{scholar.id}?ref=telegram" in text and "days left" in text
    assert db.session.get(Job, intern.id).posted_at is not None

    assert social.run() == {"status": "already_posted"}                  # once a day
    _add("Another intern", "internship")
    assert social.run(force=True)["items"] == 1                          # already-posted items never repeat


def test_failure_keeps_items_for_next_time(telegram):
    j = _add("Weekend cafe", "part-time")
    telegram.fail.append(True)
    r = social.run()
    assert r["status"] == "failed" and "chat not found" in r["error"]
    assert db.session.get(Job, j.id).posted_at is None
    telegram.fail.clear()
    assert social.run()["status"] == "posted"


def test_skips_without_settings_or_new_items(telegram, monkeypatch):
    assert social.run() == {"status": "nothing_new"}
    _add("Old intern", "internship", created_at=datetime.utcnow() - timedelta(days=10))
    assert social.run() == {"status": "nothing_new"}                     # only fresh postings
    monkeypatch.delenv("TELEGRAM_BOT_TOKEN")
    _add("New intern", "internship")
    assert social.run() == {"status": "not_configured"} and not telegram.sent


def test_admin_endpoints(client, admin, telegram):
    _add("Speech contest", "contest")
    assert client.get("/api/admin/social").status_code == 401
    s = admin.get("/api/admin/social").get_json()
    assert s["telegram_configured"] and s["next"]["count"] == 1 and "Speech contest" in s["next"]["text"]
    assert client.post("/api/admin/social/run").status_code == 401
    assert client.post("/api/admin/social/run", headers={"X-Scraper-Key": "test-scraper"}).get_json()["status"] == "posted"
    assert admin.get("/api/admin/social").get_json()["history"][0]["status"] == "posted"
    assert admin.post("/api/admin/social/post-now").get_json()["status"] == "nothing_new"
