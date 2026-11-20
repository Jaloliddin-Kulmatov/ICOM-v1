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
        return SimpleNamespace(status_code=200, headers={"content-type": "application/json"},
                               json=lambda: {"ok": True, "result": {"message_id": 77}})

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


def _press(bot, client, data, user=111):
    update = {"callback_query": {"id": "cq1", "data": data, "from": {"id": user},
                                 "message": {"message_id": 5, "chat": {"id": user}}}}
    return client.post("/api/admin/telegram/webhook", json=update,
                       headers={"X-Telegram-Bot-Api-Secret-Token": telegram_bot.webhook_secret()})


def _texts(bot):
    return [d.get("text") or d.get("caption") or "" for _, d in bot.sent]


def test_link_is_analyzed_then_published_from_buttons(bot, client):
    assert bot.send("look https://camp.example.com/apply").status_code == 200
    job = Job.query.filter_by(source_url="https://camp.example.com/apply").one()
    assert (job.job_type, job.is_active, job.review_status) == ("program", False, "draft")   # not live yet
    check = bot.sent[-1][1]
    assert "Link check" in check["text"] and "Seoul Global Center" in check["text"] and "D-2 students" in check["text"]
    assert f"pub:{job.id}" in check["reply_markup"] and f"edit:{job.id}" in check["reply_markup"]

    bot.sent.clear()
    _press(bot, client, f"pub:{job.id}")
    db.session.refresh(job)
    assert (job.is_active, job.review_status) == (True, "approved") and job.posted_at is not None
    photo = next(d for m, d in bot.sent if m == "sendPhoto")
    assert photo["chat_id"] == "@icomtest" and "Global Startup Camp 2027" in photo["caption"]
    assert any(m == "editMessageText" and "Published and posted" in d["text"] for m, d in bot.sent)

    bot.sent.clear()
    bot.send("https://camp.example.com/apply")                            # same link again: no duplicate
    assert Job.query.filter_by(source_url="https://camp.example.com/apply").count() == 1
    assert "Already on ICOM" in bot.sent[-1][1]["text"]


def test_editing_with_buttons_and_commands_updates_the_channel(bot, client):
    bot.send("https://camp.example.com/edit-me")
    job = Job.query.filter_by(source_url="https://camp.example.com/edit-me").one()
    _press(bot, client, f"pub:{job.id}")
    sent_before = len(bot.sent)

    _press(bot, client, f"ef:{job.id}:deadline")
    assert "new <b>deadline</b>" in bot.sent[-1][1]["text"]
    bot.send("next week")
    assert "like 2026-12-31" in bot.sent[-1][1]["text"]                   # bad date: asked again
    bot.send("2099-06-30")
    db.session.refresh(job)
    assert job.deadline == "2099-06-30"
    assert any(m == "editMessageCaption" for m, _ in bot.sent[sent_before:])   # the channel post follows

    bot.send(f"/edit {job.id} who Undergraduates on D-2 or D-4")
    db.session.refresh(job)
    assert "Who can apply: Undergraduates on D-2 or D-4" in job.description and job.description.count("Who can apply") == 1
    _press(bot, client, f"kind:{job.id}:contest")
    db.session.refresh(job)
    assert job.job_type == "contest"
    bot.send(f"/hide {job.id}")
    db.session.refresh(job)
    assert not job.is_active
    bot.send("/list")
    assert f"#{job.id}" in bot.sent[-1][1]["text"]


def test_owner_manages_admins(bot):
    bot.send("/addadmin 333 Aziz")
    assert "333" in _texts(bot)[-2] and "now an ICOM bot admin" in _texts(bot)[-1]
    assert 333 in telegram_bot.admin_ids()
    bot.send("/addadmin 444", user=333)                                   # admins can't add admins
    assert "Only the owner" in bot.sent[-1][1]["text"]
    bot.send("/help", user=333)
    assert "/addadmin" not in bot.sent[-1][1]["text"]
    bot.send("/removeadmin 333")
    assert 333 not in telegram_bot.admin_ids()


def test_strangers_and_bad_requests(bot, client):
    bot.send("https://camp.example.com/other", user=999)
    assert not Job.query.filter_by(source_url="https://camp.example.com/other").first()
    assert "internships/share" in bot.sent[-1][1]["text"] and "999" in bot.sent[-1][1]["text"]
    bot.send("/start", user=999)
    assert "Your Telegram id" in bot.sent[-1][1]["text"]
    _press(bot, client, "pub:1", user=999)
    assert "Only ICOM admins" in bot.sent[-1][1]["text"]
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


def test_a_saved_list_of_links_gets_a_card_each(bot):
    bot.send("Notes\nhttps://camp.example.com/a\nCheck coupon\nhttps://camp.example.com/b\nhttps://camp.example.com/a")
    texts = [d.get("text") or "" for _, d in bot.sent]
    assert any("Got 2 links" in t for t in texts)                       # repeated link counted once
    assert sum("Link check" in t for t in texts) == 2
    assert Job.query.filter(Job.source_url.in_(["https://camp.example.com/a", "https://camp.example.com/b"])).count() == 2


def test_card_says_when_the_ai_could_not_check(bot, monkeypatch):
    def broken(model, messages, **kw):
        raise RuntimeError("rate limit")
    monkeypatch.setattr(ai_routes, "_get_client", lambda: SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=broken))))
    monkeypatch.setattr(telegram_bot.imp.time, "sleep", lambda s: None)
    bot.send("https://camp.example.com/no-ai")
    job = Job.query.filter_by(source_url="https://camp.example.com/no-ai").one()
    assert job.job_type == "program"                                     # guessed from "camp"
    assert "AI couldn't check this page" in bot.sent[-1][1]["text"]


UZ_POST = """🇰🇷 Koreyada "Global Startup Camp 2027" — bepul startap lageri!

Seoul Global Center xalqaro talabalarni 4 haftalik lagerga taklif qiladi. Lager davomida ishtirokchilar o‘z g‘oyalarini rivojlantiradi, tajribali mentorlar bilan ishlaydi va
dastur oxirida investorlar hamda hamkor kompaniyalar oldida o‘z loyihalarini taqdim etadi. Barcha mashg‘ulotlar ingliz tilida.

👥 Dastur haqida:
• Davlat / Joylashuv: Janubiy Koreya (Seul)
• Tashkilotchi: Seoul Global Center
• Kimlar uchun: D-2 vizasidagi talabalar

🎁 Imtiyozlar:
• Bepul ishtirok
• Mentorlar bilan ishlash
• Sertifikat va yakuniy taqdimot
• Investorlar bilan uchrashuv
• Jamoaviy loyiha tajribasi
• Tarmoq (networking) imkoniyatlari
• Koreya startap ekotizimi bilan tanishish
• Ingliz tilidagi mashg‘ulotlar
• Har bir jamoaga alohida mentor biriktiriladi
• Eng yaxshi uchta loyiha uchun pul mukofotlari
• Seul shahridagi startap ofislariga tashriflar
• Koreya kompaniyalarida amaliyot o‘tash imkoniyati
• Dastur yakunida rasmiy sertifikat beriladi

📌 Ariza to‘lovi: Bepul

📊 Oxirgi muddat (Deadline): 2099-12-01"""


def test_full_post_in_the_channels_style(bot, client, monkeypatch):
    def answer(model, messages, **kw):
        writing = "Telegram posts" in messages[0]["content"]
        content = UZ_POST if writing else json.dumps(AI)
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])
    monkeypatch.setattr(ai_routes, "_get_client", lambda: SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=answer))))
    bot.send("https://camp.example.com/uz")
    job = Job.query.filter_by(source_url="https://camp.example.com/uz").one()
    assert job.post_text.startswith("🇰🇷 Koreyada")
    check = bot.sent[-1][1]["text"]
    assert "<b>🇰🇷 Koreyada" in check and "Dastur haqida" in check and "Batafsil va ariza" in check
    assert "Bizning kanal: @icomtest" in check

    bot.sent.clear()
    _press(bot, client, f"pub:{job.id}")
    method, data = next((m, d) for m, d in bot.sent if d.get("chat_id") == "@icomtest")
    assert method == "sendMessage"                                       # too long for a photo caption
    preview = json.loads(data["link_preview_options"])
    assert "style=spotlight" in preview["url"] and preview["show_above_text"] and preview["prefer_large_media"]
    assert "Imtiyozlar" in data["text"] and "https://camp.example.com/uz" in data["text"]

    sent_before = len(bot.sent)
    bot.send(f"/edit {job.id} post Qisqa post matni")                  # the admin's own wording
    db.session.refresh(job)
    assert job.post_text == "Qisqa post matni"
    assert any(m == "editMessageText" for m, _ in bot.sent[sent_before:])   # the channel post follows
