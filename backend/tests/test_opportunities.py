"""Scholarships, contests and programs shared by students, next to part-time jobs."""
from datetime import datetime, timedelta

from conftest import User

SCHOLARSHIP = {"kind": "scholarship", "title": "International student excellence scholarship",
               "company": "JBNU Office of International Affairs", "pay": "50% tuition",
               "deadline": "2099-03-31", "eligibility": "D-2, TOPIK 4+",
               "contact": "https://example.ac.kr/scholarship"}


def test_scholarship_needs_no_city_or_pay_and_goes_live_after_review(client, admin):
    u = User(client, "Scholar", "opp.scholar@icom.test")
    r = u.post("/api/admin/jobs/submit", json={**SCHOLARSHIP, "pay": ""})
    assert r.status_code == 201, r.get_json()
    job_id = r.get_json()["job"]["id"]
    pending = next(j for j in admin.get("/api/admin/jobs/pending").get_json()["jobs"] if j["id"] == job_id)
    assert pending["type"] == "scholarship" and pending["deadline"] == "2099-03-31"
    assert "Who can apply: D-2, TOPIK 4+" in pending["description"]

    assert admin.post(f"/api/admin/jobs/{job_id}/review", json={"action": "approve"}).status_code == 200
    listed = {j["id"]: j for j in client.get("/api/admin/jobs").get_json()["jobs"]}
    assert listed[job_id]["type"] == "scholarship" and listed[job_id]["apply_link"] == SCHOLARSHIP["contact"]


def test_submit_checks_kind_link_and_deadline(client):
    u = User(client, "Checker", "opp.check@icom.test")
    assert u.post("/api/admin/jobs/submit", json={**SCHOLARSHIP, "kind": "lottery"}).status_code == 400
    r = u.post("/api/admin/jobs/submit", json={**SCHOLARSHIP, "contact": ""})
    assert r.status_code == 400 and "how to apply" in r.get_json()["error"]
    assert u.post("/api/admin/jobs/submit", json={**SCHOLARSHIP, "deadline": "next friday"}).status_code == 400
    # part-time is still the default kind and still needs a city and pay
    r = u.post("/api/admin/jobs/submit", json={k: v for k, v in SCHOLARSHIP.items() if k != "kind"})
    assert r.status_code == 400 and "city" in r.get_json()["error"]


def test_job_alerts_leave_out_scholarships(app):
    from app import db
    from daily_emails import matching_jobs
    from models import Job, User as UserModel
    since = datetime.utcnow() - timedelta(minutes=5)
    with app.app_context():
        _check_alerts(db, matching_jobs, Job, UserModel, since)


def _check_alerts(db, matching_jobs, Job, UserModel, since):
    db.session.add_all([
        Job(title="Alert scholarship", company="Uni", job_type="scholarship", is_active=True),
        Job(title="Alert internship", company="Co", job_type="internship", is_active=True),
        Job(title="Alert legacy job", company="Co", job_type=None, is_active=True),
    ])
    db.session.commit()
    titles = {j.title for j in matching_jobs(UserModel(name="x", email="x@x", password_hash=""), since)}
    assert "Alert internship" in titles and "Alert legacy job" in titles and "Alert scholarship" not in titles
