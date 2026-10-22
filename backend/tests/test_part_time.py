"""Part-time jobs shared by students, reviewed by admins."""
from conftest import User


GOOD = {"title": "Cafe staff (weekends)", "company": "Bean Cafe near JBNU", "location": "Jeonju",
        "pay": "₩10,320 / hour", "schedule": "Sat–Sun 10:00–18:00", "korean": "Basic conversation",
        "contact": "https://open.kakao.com/o/example", "description": "Make drinks, keep the counter clean."}


def _listed_ids(client):
    return [j["id"] for j in client.get("/api/admin/jobs").get_json()["jobs"]]


def test_submit_needs_sign_in_and_fields(client):
    assert client.post("/api/admin/jobs/submit", json=GOOD).status_code == 401
    u = User(client, "Part Timer", "pt.fields@icom.test")
    r = u.post("/api/admin/jobs/submit", json={**GOOD, "pay": "", "contact": ""})
    assert r.status_code == 400 and "pay" in r.get_json()["error"] and "how to apply" in r.get_json()["error"]


def test_submitted_job_is_hidden_until_approved(client, admin):
    u = User(client, "Sharer", "pt.share@icom.test")
    r = u.post("/api/admin/jobs/submit", json=GOOD)
    assert r.status_code == 201, r.get_json()
    job_id = r.get_json()["job"]["id"]
    assert job_id not in _listed_ids(client)
    assert client.get(f"/api/admin/jobs/{job_id}").status_code == 404

    # Only admins see the queue and can review.
    assert u.get("/api/admin/jobs/pending").status_code == 403
    assert u.post(f"/api/admin/jobs/{job_id}/review", json={"action": "approve"}).status_code == 403
    pending = admin.get("/api/admin/jobs/pending").get_json()["jobs"]
    mine = next(j for j in pending if j["id"] == job_id)
    assert mine["type"] == "part-time" and mine["submitted_by"]["email"] == "pt.share@icom.test"
    assert "Schedule: Sat–Sun 10:00–18:00" in mine["description"]

    r = admin.post(f"/api/admin/jobs/{job_id}/review", json={"action": "approve"})
    assert r.status_code == 200
    assert job_id in _listed_ids(client)
    job = client.get(f"/api/admin/jobs/{job_id}").get_json()["job"]
    assert job["type"] == "part-time" and job["apply_link"] == GOOD["contact"]
    assert job_id not in [j["id"] for j in admin.get("/api/admin/jobs/pending").get_json()["jobs"]]


def test_rejected_job_stays_hidden(client, admin):
    u = User(client, "Rejected", "pt.reject@icom.test")
    job_id = u.post("/api/admin/jobs/submit", json={**GOOD, "contact": "Call 010-0000-0000"}).get_json()["job"]["id"]
    pending = {j["id"]: j for j in admin.get("/api/admin/jobs/pending").get_json()["jobs"]}
    assert "How to apply: Call 010-0000-0000" in pending[job_id]["description"]
    assert admin.post(f"/api/admin/jobs/{job_id}/review", json={"action": "reject"}).status_code == 200
    assert job_id not in _listed_ids(client)
    assert admin.post(f"/api/admin/jobs/{job_id}/review", json={"action": "maybe"}).status_code == 400


def test_pending_limit_and_moderation(client):
    u = User(client, "Busy", "pt.busy@icom.test")
    for _ in range(3):
        assert u.post("/api/admin/jobs/submit", json=GOOD).status_code == 201
    assert u.post("/api/admin/jobs/submit", json=GOOD).status_code == 429
    v = User(client, "Bad", "pt.bad@icom.test")
    assert v.post("/api/admin/jobs/submit", json={**GOOD, "description": "escort work"}).status_code == 400
