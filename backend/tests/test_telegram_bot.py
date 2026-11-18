"""The ICOM Telegram bot: admins send a link, it goes on ICOM and to the channel."""
import json
from types import SimpleNamespace

import pytest

import routes.ai as ai_routes
import social
import telegram_bot
from app import db
from models import Job

PAGE = """<html><head><title>Global Startup Camp 2027 | Seoul Center</title>
<meta property="og:description" content="Free 4-week startup camp for international students in Seoul.">
<meta property="og:site_name" content="Seoul Global Center"></head>
<body><h1>Global Startup Camp 2027</h1><p>Apply by 2099-12-01. Open to D-2 students.</p></body></html>"""
AI = {"relevant": True, "kind": "program", "title": "Global Startup Camp 2027", "organizer": "Seoul Global Center",
      "deadline": "2099-12-01", "amount": "Free", "eligibility": "D-2 students", "summary": "A free startup camp."}


@pytest.fixture
def bot(app, client, monkeypatch):
    sent = []

    def tg_post(url, data=None, **kw):
        sent.append((url.rsplit("/", 1)[-1], data))
        return SimpleNamespace(status_code=200, headers={"content-type": "application/json"}, json=lambda: {"ok": True})

    monkeypatch.setattr(social.requests, "post", tg_post)
    monkeypatch.setattr(telegram_bot.requests, "get", lambda url, **kw: SimpleNamespace(
        text=PAGE, encoding="utf-8", apparent_encoding="utf-8", raise_for_status=lambda: None))
    monkeypatch.setattr(telegram_bot, "_public_url", lambda url: True)
    monkeypatch.setattr(social, "pick_style", lambda today=None: "digest")
    fake_ai = SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=lambda model, messages, **kw: SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content=json.dumps(AI)))]))))
    monkeypatch.setattr(ai_routes, "_get_client", lambda: fake_ai)
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "123:abc")
    monkeypatch.setenv("TELEGRAM_CHANNEL_ID", "@icomtest")
    monkeypatch.setenv("TELEGRAM_ADMIN_IDS", "111, 222")

    def send(text, user=111):
        update = {"message": {"chat": {"id": user}, "from": {"id": user}, "text": text}}
        return client.post("/api/admin/telegram/webhook", json=update,
                           headers={"X-Telegram-Bot-Api-Secret-Token": telegram_bot.webhook_secret()})
    with app.app_context():
        yield SimpleNamespace(sent=sent, send=send)


def test_admin_link_goes_live_and_is_posted(bot):
    assert bot.send("look https://camp.example.com/apply").status_code == 200
    job = Job.query.filter_by(source_url="https://camp.example.com/apply").one()
    assert (job.job_type, job.is_active, job.review_status) == ("program", True, "approved")
    assert job.posted_at is not None and "via Telegram bot" in job.tags
    methods = [m for m, _ in bot.sent]
    assert "sendPhoto" in methods                                         # spotlight in the channel
    photo = next(d for m, d in bot.sent if m == "sendPhoto")
    assert photo["chat_id"] == "@icomtest" and "Global Startup Camp 2027" in photo["caption"]
    last = bot.sent[-1][1]
    assert last["chat_id"] == 111 and "Added to ICOM and posted" in last["text"]

    bot.sent.clear()
    bot.send("https://camp.example.com/apply")                            # same link again: no duplicate
    assert Job.query.filter_by(source_url="https://camp.example.com/apply").count() == 1
    assert "Already on ICOM" in bot.sent[-1][1]["text"]


def test_strangers_and_bad_requests(bot, client):
    bot.send("https://camp.example.com/other", user=999)
    assert not Job.query.filter_by(source_url="https://camp.example.com/other").first()
    assert "Only ICOM admins" in bot.sent[-1][1]["text"] and "999" in bot.sent[-1][1]["text"]
    bot.send("/start", user=999)
    assert "Your Telegram id" in bot.sent[-1][1]["text"]
    r = client.post("/api/admin/telegram/webhook", json={"message": {}}, headers={"X-Telegram-Bot-Api-Secret-Token": "guess"})
    assert r.status_code == 401


def test_private_addresses_are_refused():
    assert not telegram_bot._public_url("http://127.0.0.1:5001/api/admin")
    assert not telegram_bot._public_url("file:///etc/passwd")


def test_admin_turns_the_bot_on(admin, bot):
    r = admin.post("/api/admin/social/telegram-bot", json={})
    assert r.status_code == 200 and r.get_json()["admins"] == 2
    method, data = bot.sent[-1]
    assert method == "setWebhook" and data["url"].endswith("/admin/telegram/webhook")
    assert data["secret_token"] == telegram_bot.webhook_secret()
    assert admin.get("/api/admin/social").get_json()["bot_admins"] == 2
