"""The daily opportunities post to Telegram."""
from datetime import datetime, timedelta
import json
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
    monkeypatch.setattr(social, "pick_style", lambda today=None: "digest")
    monkeypatch.delenv("INSTAGRAM_USER_ID", raising=False)
    monkeypatch.delenv("INSTAGRAM_ACCESS_TOKEN", raising=False)
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
    assert social.run() == {"status": "posted", "items": 2, "platforms": {"telegram": "posted"},
                            "style": "digest", "error": ""}

    url, data = telegram.sent[0]
    assert url == "https://api.telegram.org/bot123:abc/sendPhoto" and data["chat_id"] == "@icomtest"
    assert f"card.jpg?ids={scholar.id},{intern.id}" in data["photo"]           # one picture of the list
    assert "See all on ICOM" in data["reply_markup"]
    text = data["caption"]
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


def test_instagram_card_and_publish(client, telegram, monkeypatch):
    j1 = _add("GIST scholarship 2027", "scholarship", salary="Full tuition",
              deadline=(datetime.utcnow() + timedelta(days=12)).strftime("%Y-%m-%d"))
    j2 = _add("한국어 Speech contest", "contest")
    monkeypatch.setenv("INSTAGRAM_USER_ID", "1789")
    monkeypatch.setenv("INSTAGRAM_ACCESS_TOKEN", "ig-token")
    monkeypatch.setenv("PUBLIC_API_URL", "https://api.icom.test/api")
    calls = []

    def graph(method, url, **kw):
        calls.append((method, url, kw.get("data") or kw.get("params")))
        body = {"id": "c55"} if url.endswith("/media") else {"status_code": "FINISHED"} if method == "GET" else {"id": "p1"}
        return SimpleNamespace(status_code=200, headers={"content-type": "application/json"}, json=lambda: body)

    monkeypatch.setattr(social.requests, "request", graph)
    r = social.run()
    assert r["platforms"] == {"telegram": "posted", "instagram": "posted"}
    create = calls[0]
    assert create[1].endswith("/1789/media") and create[2]["access_token"] == "ig-token"
    assert create[2]["image_url"].startswith(f"https://api.icom.test/api/admin/social/card.jpg?ids={j1.id},{j2.id}&d=")
    assert "GIST scholarship 2027" in create[2]["caption"] and "#InternationalStudents" in create[2]["caption"]
    assert calls[-1][1].endswith("/1789/media_publish") and calls[-1][2]["creation_id"] == "c55"

    img = client.get(f"/api/admin/social/card.jpg?ids={j1.id},{j2.id}")
    assert img.status_code == 200 and img.mimetype == "image/jpeg" and img.data[:2] == b"\xff\xd8"
    assert client.get("/api/admin/social/card.jpg?ids=999999").status_code == 404


def test_one_platform_failing_does_not_stop_the_other(telegram, monkeypatch):
    j = _add("Program for foreign students", "program")
    monkeypatch.setenv("INSTAGRAM_USER_ID", "1789")
    monkeypatch.setenv("INSTAGRAM_ACCESS_TOKEN", "expired")
    monkeypatch.setattr(social.requests, "request", lambda *a, **k: SimpleNamespace(
        status_code=400, headers={"content-type": "application/json"},
        json=lambda: {"error": {"message": "Error validating access token"}}))
    r = social.run()
    assert r["platforms"] == {"telegram": "posted", "instagram": "failed"} and "access token" in r["error"]
    assert db.session.get(Job, j.id).posted_at is not None


def test_spotlight_and_album_styles(client, telegram, monkeypatch):
    a = _add("Spotlight scholarship", "scholarship", salary="Full tuition", location="Seoul",
             description="Great.\n\nWho can apply: D-2 students, TOPIK 4+")
    b = _add("Second intern", "internship")
    monkeypatch.setattr(social, "pick_style", lambda today=None: "spotlight")
    social.run()
    (u1, photo), (u2, rest) = telegram.sent[:2]
    assert u1.endswith("/sendPhoto") and "style=spotlight" in photo["photo"] and f"ids={a.id}&" in photo["photo"]
    assert "Full tuition" in photo["caption"] and "D-2 students, TOPIK 4+" in photo["caption"]
    assert "Apply on ICOM" in photo["reply_markup"] and f"/internships/{a.id}?ref=telegram" in photo["reply_markup"]
    assert u2.endswith("/sendMessage") and "Second intern" in rest["text"]
    assert client.get(f"/api/admin/social/card.jpg?ids={a.id}&style=spotlight").data[:2] == b"\xff\xd8"

    telegram.sent.clear()
    c, d = _add("Album contest", "contest"), _add("Album program", "program")
    monkeypatch.setattr(social, "pick_style", lambda today=None: "album")
    social.run(force=True)
    url, data = telegram.sent[0]
    media = json.loads(data["media"])
    assert url.endswith("/sendMediaGroup") and len(media) == 2 and all("style=spotlight" in m["media"] for m in media)
    assert "Album contest" in media[0]["caption"]


def test_picture_failure_falls_back_to_text(telegram, monkeypatch):
    j = _add("Fallback intern", "internship")
    real = social.requests.post

    def post(url, data=None, **kw):
        if url.endswith("/sendPhoto"):
            return SimpleNamespace(status_code=400, headers={"content-type": "application/json"},
                                   json=lambda: {"ok": False, "description": "wrong file identifier/HTTP URL specified"})
        return real(url, data=data, **kw)

    monkeypatch.setattr(social.requests, "post", post)
    r = social.run()
    assert r["status"] == "posted" and db.session.get(Job, j.id).posted_at is not None
    assert telegram.sent[-1][0].endswith("/sendMessage") and "Fallback intern" in telegram.sent[-1][1]["text"]
    assert "sent as text" in SocialPost.query.order_by(SocialPost.id.desc()).first().error
