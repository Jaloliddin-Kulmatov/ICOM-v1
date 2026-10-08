"""Test setup: a throwaway SQLite database and no network-dependent features.

Run from backend/:   python -m pytest -q
"""
import os
import sys
import tempfile

import pytest

_DB_DIR = tempfile.mkdtemp(prefix="icom-test-")
os.environ.update({
    "DATABASE_URL": f"sqlite:///{os.path.join(_DB_DIR, 'test.db')}",
    "STARTUP_TASKS": "0",
    "DISABLE_SCHEDULER": "1",
    "SECRET_KEY": "test-secret",
    "JWT_SECRET_KEY": "test-jwt-secret",
    "SCRAPER_SECRET": "test-scraper",
    "ADMIN_SECRET": "test-admin",
    "GROQ_API_KEY": "",
    "ABSTRACT_EMAIL_API_KEY": "",
    "RESEND_API_KEY": "",
    "SENDER_EMAIL": "",
    "FRONTEND_URL": "http://localhost:3000",
})
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app as app_module  # noqa: E402


@pytest.fixture(scope="session")
def app():
    flask_app = app_module.app
    flask_app.config["TESTING"] = True
    with flask_app.app_context():
        app_module._seed_all()
    return flask_app


@pytest.fixture(scope="session")
def client(app):
    return app.test_client()


class User:
    def __init__(self, client, name, email, password="secret123", **extra):
        self.client = client
        r = client.post("/api/auth/register", json={"name": name, "email": email, "password": password, **extra})
        assert r.status_code in (200, 201), r.get_json()
        body = r.get_json()
        self.token = body["token"]
        self.id = body["user"]["id"]
        self.email = email

    @property
    def h(self):
        return {"Authorization": f"Bearer {self.token}"}

    def get(self, url, **kw):
        return self.client.get(url, headers=self.h, **kw)

    def post(self, url, **kw):
        return self.client.post(url, headers=self.h, **kw)

    def patch(self, url, **kw):
        return self.client.patch(url, headers=self.h, **kw)

    def delete(self, url, **kw):
        return self.client.delete(url, headers=self.h, **kw)


@pytest.fixture(scope="session")
def alice(client):
    return User(client, "Alice Kim", "alice@example.com", university="jbnu", country="Vietnam", visa_type="D-2")


@pytest.fixture(scope="session")
def bob(client):
    return User(client, "Bob Lee", "bob@example.com", university="snu", country="Uzbekistan", visa_type="D-4")


@pytest.fixture(scope="session")
def admin(client):
    u = User(client, "Admin", "admin@example.com", university="jbnu")
    r = u.post("/api/admin/bootstrap", json={"secret": "test-admin"})
    assert r.status_code == 200, r.get_json()
    return u
