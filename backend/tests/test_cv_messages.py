"""CV maker/upload and direct messages."""
import io

from conftest import User

PDF = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"
DOCX = b"PK\x03\x04" + b"\x00" * 200


# ── CV ────────────────────────────────────────────────────────────────────────

def test_cv_requires_login(client):
    assert client.get("/api/cv/me").status_code == 401
    assert client.put("/api/cv/me", json={}).status_code == 401


def test_cv_save_cleans_and_returns(alice):
    assert alice.get("/api/cv/me").get_json()["cv"] is None
    body = {
        "full_name": "Alice Kim", "headline": "Marketing student at JBNU", "summary": "x" * 5000,
        "education": [{"school": "Jeonbuk National University", "degree": "BA", "field": "Business",
                       "start": "2023", "end": "2027", "hacker": "drop me"}, {}],
        "experience": [{"title": "Intern", "company": "Startup", "details": "Did things"}],
        "skills": ["Excel", "", "Korean (TOPIK 4)"] + ["s"] * 100,
        "languages": [{"name": "Vietnamese", "level": "Native"}],
        "links": [{"label": "LinkedIn", "url": "linkedin.com/in/alice"}],
        "unknown_field": "ignored",
    }
    r = alice.put("/api/cv/me", json=body)
    assert r.status_code == 200, r.get_json()
    cv = alice.get("/api/cv/me").get_json()["cv"]
    assert cv["full_name"] == "Alice Kim"
    assert len(cv["summary"]) == 2000
    assert len(cv["education"]) == 1 and "hacker" not in cv["education"][0]
    assert cv["skills"][:2] == ["Excel", "Korean (TOPIK 4)"] and len(cv["skills"]) <= 40
    assert cv["links"][0]["url"] == "https://linkedin.com/in/alice"
    assert "unknown_field" not in cv


def _upload(user, data, name):
    return user.post("/api/cv/me/file", data={"file": (io.BytesIO(data), name)},
                     content_type="multipart/form-data")


def test_cv_upload_download_replace_delete(alice, bob):
    assert alice.get("/api/cv/me/file").status_code == 404
    r = _upload(alice, PDF, "Alice CV.pdf")
    assert r.status_code == 201, r.get_json()
    assert r.get_json()["file"]["mime"] == "application/pdf"
    d = alice.get("/api/cv/me/file")
    assert d.status_code == 200 and d.data == PDF
    # Bob only ever gets his own (none) — no way to read Alice's file.
    assert bob.get("/api/cv/me/file").status_code == 404
    r = _upload(alice, DOCX, "cv.docx")
    assert r.status_code == 201 and "wordprocessingml" in r.get_json()["file"]["mime"]
    assert alice.delete("/api/cv/me/file").status_code == 200
    assert alice.get("/api/cv/me/file").status_code == 404


def test_cv_upload_rejects_bad_files(alice):
    assert _upload(alice, b"MZ\x90\x00 not a pdf", "cv.pdf").status_code == 400      # fake extension
    assert _upload(alice, b"PK\x03\x04zip", "photos.zip").status_code == 400         # zip, not docx
    assert _upload(alice, b"", "cv.pdf").status_code == 400
    assert _upload(alice, b"%PDF-" + b"0" * (2 * 1024 * 1024), "big.pdf").status_code == 400
    assert alice.post("/api/cv/me/file", data={}, content_type="multipart/form-data").status_code == 400


# ── Direct messages ───────────────────────────────────────────────────────────

def test_messaging_flow(client, alice, bob):
    assert client.get("/api/messages/conversations").status_code == 401
    assert alice.post("/api/messages/conversations", json={"user_id": alice.id}).status_code == 400
    assert alice.post("/api/messages/conversations", json={"user_id": 999999}).status_code == 404

    r = alice.post("/api/messages/conversations", json={"user_id": bob.id})
    assert r.status_code == 201, r.get_json()
    cid = r.get_json()["conversation"]["id"]
    # Opening again reuses the same conversation, from either side.
    assert alice.post("/api/messages/conversations", json={"user_id": bob.id}).get_json()["conversation"]["id"] == cid
    assert bob.post("/api/messages/conversations", json={"user_id": alice.id}).get_json()["conversation"]["id"] == cid

    assert alice.post(f"/api/messages/conversations/{cid}", json={"content": "  "}).status_code == 400
    assert alice.post(f"/api/messages/conversations/{cid}", json={"content": "x" * 2001}).status_code == 400
    r = alice.post(f"/api/messages/conversations/{cid}", json={"content": "Hi Bob! Are you going to the job fair?"})
    assert r.status_code == 201
    first_id = r.get_json()["message"]["id"]

    assert bob.get("/api/messages/unread").get_json()["unread"] == 1
    convs = bob.get("/api/messages/conversations").get_json()["conversations"]
    assert convs[0]["other"]["name"].startswith("Alice") and convs[0]["unread"] == 1
    assert "email" not in convs[0]["other"]

    msgs = bob.get(f"/api/messages/conversations/{cid}").get_json()["messages"]
    assert msgs[-1]["content"].startswith("Hi Bob")
    assert bob.get("/api/messages/unread").get_json()["unread"] == 0          # opened → read
    bob.post(f"/api/messages/conversations/{cid}", json={"content": "Yes, see you there"})
    newer = alice.get(f"/api/messages/conversations/{cid}?after={first_id}").get_json()["messages"]
    assert [m["content"] for m in newer] == ["Yes, see you there"]


def test_outsiders_cannot_read_or_send(client, alice, bob):
    cid = alice.post("/api/messages/conversations", json={"user_id": bob.id}).get_json()["conversation"]["id"]
    eve = User(client, "Eve", "eve@example.com")
    assert eve.get(f"/api/messages/conversations/{cid}").status_code == 404
    assert eve.post(f"/api/messages/conversations/{cid}", json={"content": "hi"}).status_code == 404
    assert not eve.get("/api/messages/conversations").get_json()["conversations"]


def test_block_report_and_moderation(client, alice):
    mallory = User(client, "Mallory", "mallory@example.com")
    cid = mallory.post("/api/messages/conversations", json={"user_id": alice.id}).get_json()["conversation"]["id"]
    mid = mallory.post(f"/api/messages/conversations/{cid}", json={"content": "Buy my stuff"}).get_json()["message"]["id"]
    assert mallory.post(f"/api/messages/conversations/{cid}", json={"content": "how to make a bomb"}).status_code == 400

    r = alice.post("/api/users/reports", json={"target_type": "message", "target_id": mid, "reason": "spam"})
    assert r.status_code == 201
    assert alice.post("/api/users/reports", json={"target_type": "nonsense", "target_id": 1}).status_code == 400
    assert alice.post(f"/api/users/{mallory.id}/block").status_code == 200
    assert mallory.post(f"/api/messages/conversations/{cid}", json={"content": "hello?"}).status_code == 403
    assert mallory.post("/api/messages/conversations", json={"user_id": alice.id}).status_code == 403
    assert alice.delete(f"/api/users/{mallory.id}/block").status_code == 200
    assert mallory.post(f"/api/messages/conversations/{cid}", json={"content": "sorry"}).status_code == 201


def test_reports_admin_only(alice, admin):
    assert alice.get("/api/users/reports").status_code == 403
    assert admin.get("/api/users/reports").status_code == 200


def test_rate_limit(client, bob):
    spammer = User(client, "Spammer", "spam@example.com")
    cid = spammer.post("/api/messages/conversations", json={"user_id": bob.id}).get_json()["conversation"]["id"]
    codes = [spammer.post(f"/api/messages/conversations/{cid}", json={"content": f"msg {i}"}).status_code for i in range(22)]
    assert codes[:20] == [201] * 20 and codes[-1] == 429


def test_public_profile_hides_email(alice, bob):
    r = alice.get(f"/api/users/{bob.id}")
    assert r.status_code == 200 and "email" not in r.get_json()["user"]
    assert alice.get("/api/users/999999").status_code == 404


def test_account_deletion_removes_cv_and_messages(client, bob):
    temp = User(client, "Leaving", "leaving@example.com")
    temp.put("/api/cv/me", json={"full_name": "Leaving"})
    _upload(temp, PDF, "cv.pdf")
    cid = temp.post("/api/messages/conversations", json={"user_id": bob.id}).get_json()["conversation"]["id"]
    temp.post(f"/api/messages/conversations/{cid}", json={"content": "bye"})
    assert temp.delete("/api/auth/me", json={"confirm": "DELETE"}).status_code == 200
    assert bob.get(f"/api/messages/conversations/{cid}").status_code == 404
    assert not any(c["id"] == cid for c in bob.get("/api/messages/conversations").get_json()["conversations"])


def test_seen_pointer(client, alice):
    reader = User(client, "Reader", "reader@example.com")
    cid = alice.post("/api/messages/conversations", json={"user_id": reader.id}).get_json()["conversation"]["id"]
    mid = alice.post(f"/api/messages/conversations/{cid}", json={"content": "Did you see this?"}).get_json()["message"]["id"]
    assert alice.get(f"/api/messages/conversations/{cid}").get_json()["conversation"]["other_read_up_to"] < mid
    reader.get(f"/api/messages/conversations/{cid}")
    assert alice.get(f"/api/messages/conversations/{cid}?after={mid}").get_json()["conversation"]["other_read_up_to"] == mid


def test_cv_basics_with_nationality(alice):
    r = alice.put("/api/cv/me", json={"full_name": "Alice Kim", "headline": "Marketing student at JBNU", "nationality": "Vietnam"})
    assert r.status_code == 200
    cv = alice.get("/api/cv/me").get_json()["cv"]
    assert (cv["full_name"], cv["headline"], cv["nationality"]) == ("Alice Kim", "Marketing student at JBNU", "Vietnam")
