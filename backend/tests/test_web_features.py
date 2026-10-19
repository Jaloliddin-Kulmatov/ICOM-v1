"""Career profile, checklist, accepted answers, club events, job hints,
alert and visa emails, and guide-sourced AI answers."""
from datetime import date, datetime, timedelta
from types import SimpleNamespace

import pytest

from app import db
from conftest import User as TUser
from models import Job, User, ClubEvent


def test_profile_fields_and_validation(alice):
    r = alice.patch("/api/auth/me", json={"visa_expiry": "2027-03-31", "topik_level": 4,
                                          "job_field": "Marketing", "city": "Seoul"})
    assert r.status_code == 200, r.get_json()
    u = r.get_json()["user"]
    assert (u["visa_expiry"], u["topik_level"], u["job_field"], u["city"]) == ("2027-03-31", 4, "Marketing", "Seoul")
    assert alice.patch("/api/auth/me", json={"visa_expiry": "31/03/2027"}).status_code == 400
    assert alice.patch("/api/auth/me", json={"topik_level": 9}).status_code == 400
    assert alice.patch("/api/auth/me", json={"topik_level": ""}).get_json()["user"]["topik_level"] is None


def test_checklist_keeps_known_steps_only(alice):
    r = alice.put("/api/auth/me/checklist", json={"done": ["arc", "bank", "made-up", "arc"]})
    assert r.get_json()["checklist"] == ["arc", "bank"]
    assert alice.get("/api/auth/me").get_json()["user"]["checklist"] == ["arc", "bank"]


def test_accept_answer(client, alice, bob):
    pid = alice.post("/api/chat/posts", json={"title": "Which bank is easiest?", "content": "No ARC yet"}).get_json()["post"]["id"]
    a1 = bob.post(f"/api/chat/posts/{pid}/answers", json={"content": "Try the bank near campus"}).get_json()["answer"]["id"]
    a2 = alice.post(f"/api/chat/posts/{pid}/answers", json={"content": "Thanks, any other?"}).get_json()["answer"]["id"]
    assert bob.post(f"/api/chat/answers/{a1}/accept").status_code == 403          # not the asker
    assert alice.post(f"/api/chat/answers/{a2}/accept").get_json()["is_accepted"] is True
    assert alice.post(f"/api/chat/answers/{a1}/accept").get_json()["is_accepted"] is True
    detail = client.get(f"/api/chat/posts/{pid}").get_json()["post"]
    assert detail["solved"] and detail["answers"][0]["id"] == a1                 # accepted first
    assert [a["is_accepted"] for a in detail["answers"]].count(True) == 1         # only one
    feed = {p["id"]: p for p in client.get("/api/chat/posts").get_json()["posts"]}
    assert feed[pid]["solved"] is True
    alice.post(f"/api/chat/answers/{a1}/accept")                                  # un-accept
    assert client.get(f"/api/chat/posts/{pid}").get_json()["post"]["solved"] is False


def test_club_events(app, client, alice, bob):
    cid = alice.post("/api/clubs", json={"name": "Hiking Club", "club_type": "community"}).get_json()["club"]["id"]
    soon = (datetime.utcnow() + timedelta(days=3)).strftime("%Y-%m-%dT%H:%M")
    assert bob.post(f"/api/clubs/{cid}/events", json={"title": "Hike", "starts_at": soon}).status_code == 403
    assert alice.post(f"/api/clubs/{cid}/events", json={"title": "Hike", "starts_at": "2020-01-01T10:00"}).status_code == 400
    assert alice.post(f"/api/clubs/{cid}/events", json={"title": "", "starts_at": soon}).status_code == 400
    r = alice.post(f"/api/clubs/{cid}/events", json={"title": "Moaksan hike", "starts_at": soon, "location": "Moaksan gate"})
    assert r.status_code == 201, r.get_json()
    eid = r.get_json()["event"]["id"]
    listing = client.get(f"/api/clubs/{cid}/events").get_json()
    assert listing["events"][0]["title"] == "Moaksan hike" and listing["can_organise"] is False
    assert alice.get(f"/api/clubs/{cid}/events").get_json()["can_organise"] is True
    assert any(e["id"] == eid for e in alice.get("/api/clubs/events/upcoming").get_json()["events"])
    bob.post(f"/api/clubs/{cid}/request")
    assert any(e["id"] == eid for e in bob.get("/api/clubs/events/upcoming").get_json()["events"])
    assert bob.delete(f"/api/clubs/events/{eid}").status_code == 403
    assert alice.delete(f"/api/clubs/events/{eid}").status_code == 200
    with app.app_context():
        db.session.add(ClubEvent(club_id=cid, title="Old", starts_at=datetime.utcnow() - timedelta(days=200)))
        db.session.commit()
        from routes.clubs import sweep_events
        assert sweep_events()["events_deleted"] >= 1


def _job(**kw):
    base = dict(title="Marketing Intern", description="", requirements="", foreigner_note="",
                foreigner_friendly="", job_type="internship")
    base.update(kw)
    return SimpleNamespace(**base)


def test_job_hints():
    from job_insights import insights, job_field, job_city
    h = insights(_job(requirements="Business-level Korean required\nExcel"))
    assert h["korean_required"] and h["student_role"] and not h["visa_support"]
    h = insights(_job(title="Backend Engineer", job_type="full-time", foreigner_friendly="yes",
                      description="We offer E-7 visa sponsorship. English is our working language."))
    assert h["english_ok"] and h["visa_support"] and not h["korean_required"] and not h["student_role"]
    assert insights(_job(requirements="TOPIK 5 or above"))["korean_required"]
    assert job_field("Data Analyst Intern", "", "") == "IT / Software"
    assert job_field("Brand Marketing Intern", "", ["SNS"]) == "Marketing"
    assert job_city("서울 강남구") == "Seoul" and job_city("Pangyo, Gyeonggi") == "Seongnam" and job_city("") == "Other"


def test_job_alert_digest(app, client, monkeypatch):
    import daily_emails
    sent = []
    monkeypatch.setattr(daily_emails, "_send", lambda to, subj, html, text: sent.append((to, subj, html)) or True)
    u = TUser(client, "Dana Alert", "dana.alert@example.com", university="jbnu")
    assert u.post("/api/admin/jobs/alerts", json={"enabled": True, "field": "Marketing", "city": "Seoul"}).status_code == 200
    assert u.get("/api/admin/jobs/alerts").get_json() == {"enabled": True, "field": "Marketing", "city": "Seoul"}
    with app.app_context():
        later = datetime.utcnow() + timedelta(seconds=1)
        db.session.add_all([
            Job(title="Brand Marketing Intern", company="A", location="Seoul Gangnam", apply_link="https://x.test/a1", created_at=later),
            Job(title="Backend Engineer", company="B", location="Seoul", apply_link="https://x.test/a2", created_at=later),
            Job(title="Content Marketing Intern", company="C", location="Busan", apply_link="https://x.test/a3", created_at=later),
        ])
        db.session.commit()
        result = daily_emails.send_job_alerts(now=datetime.utcnow() + timedelta(seconds=5))
    mine = [s for s in sent if s[0] == "dana.alert@example.com"]
    assert result["alerts_sent"] >= 1 and len(mine) == 1
    assert "Brand Marketing Intern" in mine[0][2] and "Backend Engineer" not in mine[0][2] and "Content Marketing" not in mine[0][2]
    with app.app_context():
        sent.clear()
        daily_emails.send_job_alerts(now=datetime.utcnow() + timedelta(seconds=10))
    assert not [s for s in sent if s[0] == "dana.alert@example.com"]   # nothing new → no email


def test_visa_reminders(app, client, monkeypatch):
    import daily_emails
    sent = []
    monkeypatch.setattr(daily_emails, "_send", lambda to, subj, html, text: sent.append(subj) or True)
    u = TUser(client, "Eli Visa", "eli.visa@example.com", university="jbnu", visa_type="D-2")
    today = date(2026, 10, 19)
    u.patch("/api/auth/me", json={"visa_expiry": (today + timedelta(days=100)).isoformat()})
    with app.app_context():
        assert daily_emails.send_visa_reminders(today)["visa_reminders_sent"] == 0       # 100 days: too early
        assert daily_emails.send_visa_reminders(today + timedelta(days=12))["visa_reminders_sent"] == 1   # 88 left → 90-day
        assert daily_emails.send_visa_reminders(today + timedelta(days=13))["visa_reminders_sent"] == 0   # not again
        assert daily_emails.send_visa_reminders(today + timedelta(days=71))["visa_reminders_sent"] == 1   # 29 left → 30-day
    assert any("expires in 88 days" in s for s in sent)
    u.patch("/api/auth/me", json={"visa_expiry": (today + timedelta(days=400)).isoformat()})
    with app.app_context():
        assert db.session.query(User).filter_by(email="eli.visa@example.com").first().visa_reminder_sent is None


def test_guide_index_is_up_to_date():
    import json, os
    import build_guide_index
    with open(build_guide_index.OUT, encoding="utf-8") as f:
        assert json.load(f) == build_guide_index.build(), "Run: python build_guide_index.py"


def test_ai_answers_cite_guides(client, monkeypatch):
    from routes import ai
    seen = {}

    class FakeClient:
        class chat:
            class completions:
                @staticmethod
                def create(model, messages, **kw):
                    seen["system"] = messages[0]["content"]
                    return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content="Go to immigration."))])
    monkeypatch.setattr(ai, "_get_client", lambda: FakeClient)
    r = client.post("/api/ai/chat", json={"message": "How do I extend my D-2 visa?"})
    assert r.status_code == 200, r.get_json()
    assert r.get_json()["sources"] == [{"title": "Visa & Immigration", "url": "/guide/visa"}]
    assert "ICOM GUIDE EXCERPTS" in seen["system"]
    assert client.post("/api/ai/chat", json={"message": "hello there"}).get_json()["sources"] == []


def test_club_categories_are_normalised(app, alice):
    from club_categories import normalize
    assert normalize("Technology") == "tech" and normalize("outdoor") == "sports & outdoor"
    assert normalize("culture", "community") == "national community" and normalize("culture", "club") == "arts & culture"
    assert normalize("whatever") == "social"
    cid = alice.post("/api/clubs", json={"name": "Code Club", "category": "Technology"}).get_json()["club"]["id"]
    assert alice.patch(f"/api/clubs/{cid}", json={"category": "Health & Wellness"}).get_json()["club"]["category"] == "sports & outdoor"
    with app.app_context():
        from models import Club
        c = db.session.get(Club, cid)
        c.category = "Arts"   # an old name written directly
        db.session.commit()
        import app as app_module
        app_module._normalize_club_categories()
        db.session.expire_all()
        assert db.session.get(Club, cid).category == "arts & culture"
