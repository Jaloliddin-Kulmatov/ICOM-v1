"""Cached lists stay correct after changes; old news is cleaned up."""
from datetime import date, timedelta

from app import db
from models import Notice


def test_club_list_updates_after_joining_and_hides_private_info(client, alice, bob):
    cid = alice.post("/api/clubs", json={"name": "Cache Club", "university": "jbnu", "kakao_link": "https://open.kakao.com/x"}).get_json()["club"]["id"]
    def mine(user):
        return next(c for c in user.get("/api/clubs").get_json()["clubs"] if c["id"] == cid)
    bob_uni_view = bob.get("/api/clubs").get_json()["clubs"]
    # bob is at snu: a jbnu club isn't listed for him; alice (creator) sees private info.
    assert all(c["id"] != cid for c in bob_uni_view)
    assert mine(alice)["is_creator"] and mine(alice)["kakao_link"] == "https://open.kakao.com/x"
    before = mine(alice)["member_count"]
    carol = __import__("conftest").User(client, "Carol Lim", "carol.cache@example.com", university="jbnu")
    assert mine(carol)["kakao_link"] is None and mine(carol)["my_status"] is None
    carol.post(f"/api/clubs/{cid}/request")
    assert mine(carol)["my_status"] in ("pending", "approved")       # cache dropped on commit
    alice.post(f"/api/clubs/{cid}/approve/{carol.id}")
    assert mine(carol)["my_status"] == "approved" and mine(carol)["kakao_link"]
    assert mine(alice)["member_count"] == before + 1
    anon = next((c for c in client.get("/api/clubs").get_json()["clubs"] if c["id"] == cid), None)
    assert anon is None or anon["kakao_link"] is None


def test_chat_feed_updates_immediately(client, alice):
    pid = alice.post("/api/chat/posts", json={"title": "Cache test question", "content": "?"}).get_json()["post"]["id"]
    assert any(p["id"] == pid for p in client.get("/api/chat/posts").get_json()["posts"])
    alice.delete(f"/api/chat/posts/{pid}")
    assert all(p["id"] != pid for p in client.get("/api/chat/posts").get_json()["posts"])


def test_old_news_hidden_and_deleted(app, client):
    today = date.today()
    with app.app_context():
        for aid, days in (("n-new", 3), ("n-old", 200), ("n-ancient", 400)):
            db.session.add(Notice(source="test", article_id=aid, category="international",
                                  title_en=aid, posted_date=(today - timedelta(days=days)).isoformat()))
        db.session.commit()
    titles = {n["title"] if "title" in n else n.get("title_en") for n in client.get("/api/news").get_json()["notices"]}
    assert "n-new" in str(titles) and "n-old" not in str(titles)
    with app.app_context():
        from routes.news import sweep_news
        result = sweep_news()
        assert result["news_deleted"] >= 1
        assert Notice.query.filter_by(article_id="n-ancient").first() is None
        assert Notice.query.filter_by(article_id="n-old").first().is_active is False


def test_verify_now_is_admin_only(app, alice, admin, monkeypatch):
    import app as app_module
    calls = []
    monkeypatch.setattr(app_module, "_verify_jobs_on_wanted", lambda a: calls.append(1))
    assert alice.post("/api/admin/jobs/verify-now").status_code == 403
    r = admin.post("/api/admin/jobs/verify-now")
    assert r.status_code in (200, 202), r.get_json()
    assert "Wanted" in r.get_json()["message"] or "running" in r.get_json()["message"]


def test_health_db_reports_round_trip(client):
    body = client.get("/api/health/db").get_json()
    assert body["db_round_trip_ms"] >= 0 and len(body["samples_ms"]) == 3
