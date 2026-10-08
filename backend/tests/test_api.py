"""End-to-end checks for every API area, as a visitor, two students and an admin."""
from datetime import date, timedelta

SCRAPER = {"X-Scraper-Key": "test-scraper"}


# ── Health, stats, search ─────────────────────────────────────────────────────

def test_health_and_root(client):
    assert client.get("/api/health").get_json() == {"status": "ok"}
    assert client.get("/").status_code == 200
    assert client.get("/api/ai/health").status_code == 200


def test_member_stats_and_visit(client):
    r = client.get("/api/track/stats")
    assert r.status_code == 200
    assert client.post("/api/track/visit").status_code in (200, 201, 204)


def test_search(client, alice):
    assert client.get("/api/search?q=").status_code in (200, 400)
    r = client.get("/api/search?q=visa")
    assert r.status_code == 200, r.get_json()


# ── Auth ──────────────────────────────────────────────────────────────────────

def test_register_validation(client):
    assert client.post("/api/auth/register", json={}).status_code == 400
    assert client.post("/api/auth/register", json={"name": "X", "email": "bad", "password": "secret123"}).status_code == 400
    assert client.post("/api/auth/register", json={"name": "X", "email": "x@example.com", "password": "123"}).status_code == 400


def test_register_duplicate_and_login(client, alice):
    r = client.post("/api/auth/register", json={"name": "A", "email": "ALICE@example.com", "password": "secret123"})
    assert r.status_code == 409
    assert client.post("/api/auth/login", json={"email": "alice@example.com", "password": "wrong"}).status_code == 401
    r = client.post("/api/auth/login", json={"email": "Alice@Example.com", "password": "secret123"})
    assert r.status_code == 200 and r.get_json()["token"]


def test_check_email(client, alice):
    r = client.get("/api/auth/check-email?email=alice@example.com")
    assert r.status_code == 200
    assert r.get_json().get("exists") is True


def test_me_get_and_update(alice):
    r = alice.get("/api/auth/me")
    assert r.status_code == 200 and r.get_json()["user"]["email"] == "alice@example.com"
    r = alice.patch("/api/auth/me", json={"country": "Vietnam", "name": "Alice K."})
    assert r.status_code == 200, r.get_json()
    assert alice.get("/api/auth/me").get_json()["user"]["name"] == "Alice K."


def test_me_requires_auth(client):
    assert client.get("/api/auth/me").status_code == 401


def test_google_requires_token(client):
    assert client.post("/api/auth/google", json={}).status_code == 400


def test_delete_account_flow(client):
    from conftest import User
    u = User(client, "Temp", "temp@example.com")
    assert u.delete("/api/auth/me").status_code == 400            # needs confirm
    assert u.delete("/api/auth/me", json={"confirm": "DELETE"}).status_code == 200
    assert client.post("/api/auth/login", json={"email": "temp@example.com", "password": "secret123"}).status_code == 401


# ── Community Q&A (chat) ──────────────────────────────────────────────────────

def test_chat_post_answer_delete(client, alice, bob):
    assert client.post("/api/chat/posts", json={"title": "t", "content": "c"}).status_code == 401
    assert alice.post("/api/chat/posts", json={"title": "", "content": ""}).status_code == 400
    r = alice.post("/api/chat/posts", json={"title": "Where to get ARC photos?", "content": "Near campus please"})
    assert r.status_code == 201, r.get_json()
    pid = r.get_json()["post"]["id"]
    assert any(p["id"] == pid for p in client.get("/api/chat/posts").get_json()["posts"])
    r = bob.post(f"/api/chat/posts/{pid}/answers", json={"content": "Photo shop by the main gate"})
    assert r.status_code == 201, r.get_json()
    aid = r.get_json()["answer"]["id"]
    detail = client.get(f"/api/chat/posts/{pid}").get_json()["post"]
    assert detail["answer_count"] == 1
    assert alice.delete(f"/api/chat/answers/{aid}").status_code == 403   # not her answer
    assert bob.delete(f"/api/chat/answers/{aid}").status_code == 200
    assert bob.delete(f"/api/chat/posts/{pid}").status_code == 403      # not his post
    assert alice.delete(f"/api/chat/posts/{pid}").status_code == 200
    assert client.get(f"/api/chat/posts/{pid}").status_code == 404


def test_chat_university_posts_stay_private(client, alice, bob):
    r = alice.post("/api/chat/posts", json={"title": "JBNU only", "content": "Dorm question", "scope": "university"})
    assert r.status_code == 201, r.get_json()
    pid = r.get_json()["post"]["id"]
    assert any(p["id"] == pid for p in alice.get("/api/chat/posts").get_json()["posts"])
    assert not any(p["id"] == pid for p in bob.get("/api/chat/posts").get_json()["posts"])
    assert not any(p["id"] == pid for p in client.get("/api/chat/posts").get_json()["posts"])
    # Opening it directly must not leak it either.
    assert client.get(f"/api/chat/posts/{pid}").status_code == 404
    assert bob.get(f"/api/chat/posts/{pid}").status_code == 404
    assert alice.get(f"/api/chat/posts/{pid}").status_code == 200
    assert bob.post(f"/api/chat/posts/{pid}/answers", json={"content": "hi"}).status_code == 404


def test_chat_moderation_blocks_abuse(alice):
    r = alice.post("/api/chat/posts", json={"title": "how to make a bomb", "content": "explosive instructions"})
    assert r.status_code == 400


# ── Clubs ─────────────────────────────────────────────────────────────────────

def test_clubs_list_counts_and_detail(client, alice):
    counts = client.get("/api/clubs/counts")
    assert counts.status_code == 200
    r = client.get("/api/clubs")
    assert r.status_code == 200
    clubs = r.get_json()["clubs"]
    assert clubs, "seeded clubs/communities should be listed"
    cid = clubs[0]["id"]
    assert client.get(f"/api/clubs/{cid}").status_code == 200
    assert client.get("/api/clubs/999999").status_code == 404


def test_club_lifecycle(alice, bob):
    r = alice.post("/api/clubs", json={"name": "Test Hiking Club", "category": "sports", "description": "Weekend hikes"})
    assert r.status_code == 201, r.get_json()
    cid = r.get_json()["club"]["id"]
    assert bob.post(f"/api/clubs/{cid}/request").status_code in (200, 201)
    assert bob.post(f"/api/clubs/{cid}/request").status_code == 409
    reqs = alice.get(f"/api/clubs/{cid}/requests")
    assert bob.get(f"/api/clubs/{cid}/requests").status_code == 403
    if reqs.get_json().get("requests"):
        assert alice.post(f"/api/clubs/{cid}/approve/{bob.id}").status_code == 200
    members = alice.get(f"/api/clubs/{cid}/members")
    assert members.status_code == 200
    assert bob.post(f"/api/clubs/{cid}/chat", json={"content": "Hello everyone"}).status_code == 201
    msgs = alice.get(f"/api/clubs/{cid}/chat").get_json()["messages"]
    assert any(m["content"] == "Hello everyone" for m in msgs)
    assert bob.patch(f"/api/clubs/{cid}", json={"name": "Hijacked"}).status_code == 403
    assert alice.patch(f"/api/clubs/{cid}", json={"description": "Every Saturday"}).status_code == 200
    assert any(c["id"] == cid for c in bob.get("/api/clubs/mine").get_json()["joined"])
    assert alice.delete(f"/api/clubs/{cid}/kick/{bob.id}").status_code == 200
    assert bob.get(f"/api/clubs/{cid}/chat").status_code == 403
    assert bob.delete(f"/api/clubs/{cid}").status_code == 403
    assert alice.delete(f"/api/clubs/{cid}").status_code == 200


def test_club_leave_and_reject(alice, bob):
    cid = alice.post("/api/clubs", json={"name": "Language Exchange"}).get_json()["club"]["id"]
    bob.post(f"/api/clubs/{cid}/request")
    if alice.get(f"/api/clubs/{cid}/requests").get_json().get("requests"):
        assert alice.post(f"/api/clubs/{cid}/reject/{bob.id}").status_code == 200
    else:
        assert bob.post(f"/api/clubs/{cid}/leave").status_code == 200
    assert bob.post(f"/api/clubs/{cid}/leave").status_code == 404


# ── News posts ────────────────────────────────────────────────────────────────

def test_news_posts_permissions(client, alice):
    assert client.get("/api/posts").status_code == 200
    assert alice.get("/api/posts/options").status_code == 200
    # Regular students can't publish News.
    r = alice.post("/api/posts", json={"content": "Hello", "posted_as_type": "university"})
    assert r.status_code == 403


def test_news_post_by_club_owner_with_comments(alice, bob):
    cid = alice.post("/api/clubs", json={"name": "Owner Club"}).get_json()["club"]["id"]
    r = alice.post("/api/posts", json={"content": "Meetup Friday", "posted_as_type": "club", "club_id": cid})
    assert r.status_code == 201, r.get_json()
    pid = r.get_json()["post"]["id"]
    r = bob.post(f"/api/posts/{pid}/comments", json={"content": "See you there"})
    assert r.status_code in (201, 403), r.get_json()
    assert alice.get(f"/api/posts/{pid}/comments").status_code == 200
    assert bob.delete(f"/api/posts/{pid}").status_code == 403
    assert alice.delete(f"/api/posts/{pid}").status_code == 200


def test_jbnu_notices_list(client):
    assert client.get("/api/news").status_code == 200
    assert client.get("/api/news?category=international").status_code == 200


# ── Feedback, ambassador ──────────────────────────────────────────────────────

def test_feedback(client, alice, admin):
    assert client.post("/api/feedback", json={"message": ""}).status_code == 400
    r = client.post("/api/feedback", json={"message": "Love it", "rating": 5, "name": "Visitor"})
    assert r.status_code == 201, r.get_json()
    assert alice.get("/api/feedback").status_code == 403
    items = admin.get("/api/feedback").get_json()["feedback"]
    assert items
    assert admin.delete(f"/api/feedback/{items[0]['id']}").status_code == 200


def test_ambassador_flow(alice, admin):
    r = alice.post("/api/ambassador/apply", json={"university": "JBNU", "motivation": "Help newcomers"})
    assert r.status_code in (200, 201), r.get_json()
    assert alice.get("/api/ambassador/applications").status_code == 403
    apps = admin.get("/api/ambassador/applications").get_json()["applications"]
    app_id = apps[0]["id"]
    assert admin.patch(f"/api/ambassador/applications/{app_id}", json={"status": "approved"}).status_code == 200
    assert admin.delete(f"/api/ambassador/applications/{app_id}").status_code == 200


# ── AI without a key fails gracefully ─────────────────────────────────────────

def test_ai_without_key(client):
    assert client.post("/api/ai/chat", json={}).status_code == 400
    assert client.post("/api/ai/chat", json={"message": "hi"}).status_code == 503
    assert client.post("/api/ai/translate", json={"text": "안녕"}).status_code == 503
    assert client.post("/api/ai/restaurants", json={"city": "Jeonju"}).status_code == 503


# ── Admin ─────────────────────────────────────────────────────────────────────

def test_admin_only_routes(alice, admin):
    for url in ("/api/admin/users", "/api/admin/analytics", "/api/admin/jobs/scrape-status"):
        assert alice.get(url).status_code == 403, url
        assert admin.get(url).status_code == 200, url
    assert alice.post("/api/admin/bootstrap", json={"secret": "wrong"}).status_code == 403


# ── Internships ───────────────────────────────────────────────────────────────

def _job(n, **kw):
    d = {"title": f"Marketing Intern {n}", "company": f"Startup {n}", "location": "Seoul",
         "description": "Help our global team.", "requirements": "English\nKorean basics",
         "deadline": "", "tags": "marketing", "foreigner_friendly": "yes",
         "apply_link": f"https://www.wanted.co.kr/wd/{900000 + n}", "job_type": "internship"}
    d.update(kw)
    return d


def test_jobs_admin_crud(client, alice, admin):
    assert alice.post("/api/admin/jobs", json={"title": "x", "company": "y"}).status_code == 403
    r = admin.post("/api/admin/jobs", json={"title": "Research Assistant", "company": "JBNU Lab", "deadline": ""})
    assert r.status_code == 201
    jid = r.get_json()["job"]["id"]
    assert any(j["id"] == jid for j in client.get("/api/admin/jobs").get_json()["jobs"])
    assert admin.patch(f"/api/admin/jobs/{jid}", json={"salary": "₩1.5M/month"}).status_code == 200
    assert client.get(f"/api/admin/jobs/{jid}").get_json()["job"]["salary"] == "₩1.5M/month"
    assert client.post(f"/api/admin/jobs/{jid}/apply-click").get_json()["apply_count"] == 1
    assert client.post(f"/api/admin/jobs/{jid}/apply-click").get_json()["apply_count"] == 1  # throttled
    assert client.get("/api/admin/jobs/top-companies").status_code == 200
    assert admin.delete(f"/api/admin/jobs/{jid}").status_code == 200
    assert client.get(f"/api/admin/jobs/{jid}").status_code == 404


def test_job_alerts(alice):
    assert alice.get("/api/admin/jobs/alerts").get_json()["enabled"] is False
    r = alice.post("/api/admin/jobs/alerts", json={"enabled": True, "field": "Marketing", "location": "Seoul"})
    assert r.status_code == 200, r.get_json()
    assert alice.get("/api/admin/jobs/alerts").get_json()["enabled"] is True


def test_sync_requires_scraper_key(client):
    assert client.get("/api/admin/jobs/sync-state").status_code == 401
    assert client.post("/api/admin/jobs/sync", json={}).status_code == 401


def test_sync_insert_update_close_expire(client):
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    plan = {"upsert": [_job(1), _job(2, deadline=tomorrow), _job(3, deadline=yesterday),
                       _job(4, foreigner_friendly="no")], "close": []}
    r = client.post("/api/admin/jobs/sync", json=plan, headers=SCRAPER)
    assert r.status_code == 200, r.get_json()
    res = r.get_json()
    # expired also counts seeded demo jobs whose deadlines have passed
    assert res["inserted"] == 3 and res["skipped"] == 1 and res["expired"] >= 1
    listed = {j["apply_link"] for j in client.get("/api/admin/jobs").get_json()["jobs"]}
    assert _job(1)["apply_link"] in listed and _job(2)["apply_link"] in listed
    assert _job(3)["apply_link"] not in listed          # past deadline
    assert _job(4)["apply_link"] not in listed          # not open to foreigners

    state = {j["link"]: j for j in client.get("/api/admin/jobs/sync-state", headers=SCRAPER).get_json()["jobs"]}
    assert state[_job(1)["apply_link"]]["active"] is True

    # Refresh one, close another: list updates immediately (cache busted).
    r = client.post("/api/admin/jobs/sync", json={"upsert": [_job(1, title="Global Marketing Intern")],
                                                   "close": [_job(2)["apply_link"]]}, headers=SCRAPER)
    assert r.get_json()["updated"] == 1 and r.get_json()["closed"] == 1
    jobs = {j["apply_link"]: j for j in client.get("/api/admin/jobs").get_json()["jobs"]}
    assert jobs[_job(1)["apply_link"]]["title"] == "Global Marketing Intern"
    assert _job(2)["apply_link"] not in jobs


def test_expired_job_hidden_without_cleanup(client, admin):
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    jid = admin.post("/api/admin/jobs", json={"title": "Old", "company": "Gone Inc", "deadline": yesterday}).get_json()["job"]["id"]
    assert not any(j["id"] == jid for j in client.get("/api/admin/jobs").get_json()["jobs"])
    assert client.get(f"/api/admin/jobs/{jid}").status_code == 404


def test_bulk_ingest_still_works(client):
    r = client.post("/api/admin/jobs/bulk-ingest", json={"jobs": [_job(50)]}, headers=SCRAPER)
    assert r.status_code == 200 and r.get_json()["inserted"] == 1
    assert any(j["apply_link"] == _job(50)["apply_link"] for j in client.get("/api/admin/jobs").get_json()["jobs"])


# ── Remaining admin endpoints: none may crash ─────────────────────────────────

ADMIN_ONLY = "/api/admin/seed-"
ADMIN_ONLY_PREFIXES = ("/api/admin/make-admin", "/api/admin/users", "/api/admin/analytics",
                       "/api/admin/jobs/fix-deadlines")


def test_admin_endpoints_never_500(client, admin, bob):
    r = admin.post("/api/admin/clubs", json={"name": "Admin Club", "category": "academic"})
    assert r.status_code in (200, 201), r.get_json()
    cid = r.get_json()["club"]["id"]
    calls = [
        ("get", "/api/admin/clubs", None),
        ("get", "/api/admin/clubs/my", None),
        ("post", f"/api/admin/clubs/{cid}/join", None),
        ("post", f"/api/admin/clubs/{cid}/leave", None),
        ("patch", f"/api/admin/clubs/{cid}", {"description": "Updated"}),
        ("post", "/api/admin/make-admin", {"email": "nobody@example.com"}),
        ("get", "/api/admin/users", None),
        ("get", "/api/admin/analytics", None),
        ("post", "/api/admin/jobs/fix-deadlines", None),
        ("post", "/api/admin/seed-communities", None),
        ("post", "/api/admin/seed-university-clubs", None),
        ("post", "/api/admin/seed-icom-clubs", None),
        ("post", "/api/admin/seed-jeonju-jobs", None),
        ("delete", f"/api/admin/clubs/{cid}", None),
    ]
    for method, url, body in calls:
        r = getattr(admin, method)(url, json=body) if body is not None else getattr(admin, method)(url)
        assert r.status_code < 500, (method, url, r.status_code, r.get_json())
        if ADMIN_ONLY in url or url.startswith(ADMIN_ONLY_PREFIXES):
            assert getattr(bob, method)(url, json=body or {}).status_code in (401, 403, 404, 405), (method, url)
    assert client.get("/api/admin/jobs/alerts/unsubscribe?token=bad").status_code < 500
