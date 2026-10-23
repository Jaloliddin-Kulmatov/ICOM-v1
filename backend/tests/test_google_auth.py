"""Google sign-in only accepts tokens that Google issued to ICOM's own client ID."""
from types import SimpleNamespace

import routes.auth as auth_routes

ICOM_ID = "icom-web.apps.googleusercontent.com"


def fake_google(monkeypatch, issued_to):
    def get(url, **kw):
        if "tokeninfo" in url:
            return SimpleNamespace(status_code=200, json=lambda: {"aud": issued_to, "azp": issued_to})
        return SimpleNamespace(status_code=200, json=lambda: {
            "email": "google.user@icom.test", "name": "Google User", "email_verified": True})
    monkeypatch.setattr(auth_routes.http_requests, "get", get)


def test_token_from_icom_signs_in(client, monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", ICOM_ID)
    fake_google(monkeypatch, ICOM_ID)
    r = client.post("/api/auth/google", json={"access_token": "t", "mode": "register"})
    assert r.status_code in (200, 201), r.get_json()
    assert r.get_json()["token"]


def test_token_from_another_app_is_refused(client, monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", ICOM_ID)
    fake_google(monkeypatch, "some-other-site.apps.googleusercontent.com")
    r = client.post("/api/auth/google", json={"access_token": "t", "mode": "register"})
    assert r.status_code == 401


def test_google_off_without_client_id(client, monkeypatch):
    monkeypatch.delenv("GOOGLE_CLIENT_ID", raising=False)
    fake_google(monkeypatch, ICOM_ID)
    assert client.post("/api/auth/google", json={"access_token": "t"}).status_code == 503
