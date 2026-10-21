"""Password reset, club reports and app crash reports."""
import re

import pytest

import routes.ambassador as ambassador
import routes.auth as auth
from conftest import User


@pytest.fixture
def outbox(monkeypatch):
    mails = []
    monkeypatch.setattr(ambassador, "_email_configured", lambda: True)
    monkeypatch.setattr(ambassador, "_send_email", lambda to, subject, html, text="": mails.append((to, subject, text)) or True)
    auth._reset_hits.clear()
    return mails


def _token(mail_text: str) -> str:
    return re.search(r"reset-password\?token=(\S+)", mail_text).group(1)


def test_forgot_password_needs_email_provider(client, monkeypatch):
    monkeypatch.setattr(ambassador, "_email_configured", lambda: False)
    r = client.post("/api/auth/forgot-password", json={"email": "someone@icom.test"})
    assert r.status_code == 503


def test_forgot_password_same_answer_for_unknown_email(client, outbox):
    r = client.post("/api/auth/forgot-password", json={"email": "nobody-here@icom.test"})
    assert r.status_code == 200 and "If an account uses that email" in r.get_json()["message"]
    assert outbox == []


def test_reset_flow_changes_password_once(client, outbox):
    User(client, "Reset Me", "reset.me@icom.test", password="oldpass1")
    r = client.post("/api/auth/forgot-password", json={"email": "Reset.Me@icom.test "})
    assert r.status_code == 200 and len(outbox) == 1
    to, subject, text = outbox[0]
    assert to == "reset.me@icom.test" and "http://localhost:3000/reset-password?token=" in text
    token = _token(text)

    assert client.post("/api/auth/reset-password", json={"token": token, "password": "123"}).status_code == 400
    r = client.post("/api/auth/reset-password", json={"token": token, "password": "newpass1"})
    assert r.status_code == 200

    assert client.post("/api/auth/login", json={"email": "reset.me@icom.test", "password": "oldpass1"}).status_code == 401
    assert client.post("/api/auth/login", json={"email": "reset.me@icom.test", "password": "newpass1"}).status_code == 200
    # The same link can't be used twice.
    r = client.post("/api/auth/reset-password", json={"token": token, "password": "another1"})
    assert r.status_code == 400 and "expired or was already used" in r.get_json()["error"]


def test_reset_rejects_bad_and_expired_tokens(client, outbox, monkeypatch):
    User(client, "Expire Me", "expire.me@icom.test")
    client.post("/api/auth/forgot-password", json={"email": "expire.me@icom.test"})
    token = _token(outbox[0][2])
    assert client.post("/api/auth/reset-password", json={"token": token + "x", "password": "newpass1"}).status_code == 400
    monkeypatch.setattr(auth, "RESET_MAX_AGE", -1)
    assert client.post("/api/auth/reset-password", json={"token": token, "password": "newpass1"}).status_code == 400


def test_forgot_password_is_throttled_per_email(client, outbox):
    User(client, "Spam Me", "spam.me@icom.test")
    for _ in range(5):
        assert client.post("/api/auth/forgot-password", json={"email": "spam.me@icom.test"}).status_code == 200
    assert len(outbox) == auth.RESET_PER_EMAIL


def test_club_can_be_reported(client):
    u = User(client, "Reporter", "reporter.club@icom.test")
    r = u.post("/api/users/reports", json={"target_type": "club", "target_id": 1, "reason": "Spam"})
    assert r.status_code in (200, 201), r.get_json()


def test_app_error_report(client):
    r = client.post("/api/app/errors", json={"message": "boom", "stack": "at X", "screen": "/club/1", "version": "1.0.0", "fatal": True})
    assert r.status_code == 200 and r.get_json()["ok"] is True
