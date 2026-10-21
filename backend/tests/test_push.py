"""Phone app: device registration, push on messages and answers, app config."""
from types import SimpleNamespace

import pytest

import push
from app import db
from conftest import User
from models import Device


class InlineThread:
    def __init__(self, target, args=(), **kw):
        self.target, self.args = target, args

    def start(self):
        self.target(*self.args)


@pytest.fixture
def sent(monkeypatch):
    calls = []

    def fake_post(url, json, **kw):
        calls.append(json)
        tickets = [{"status": "error", "details": {"error": "DeviceNotRegistered"}} if "Dead" in m["to"]
                   else {"status": "ok"} for m in json]
        return SimpleNamespace(json=lambda: {"data": tickets})
    monkeypatch.setattr(push.requests, "post", fake_post)
    monkeypatch.setattr(push.threading, "Thread", InlineThread)
    return calls


def test_register_device_validates_token(client):
    u = User(client, "Phone User", "phone.user@example.com")
    assert u.post("/api/devices", json={"push_token": "not-a-token"}).status_code == 400
    assert client.post("/api/devices", json={"push_token": "ExponentPushToken[abc]"}).status_code == 401
    assert u.post("/api/devices", json={"push_token": "ExponentPushToken[abc]", "platform": "ios", "app_version": "1.0.0"}).status_code == 200
    assert u.delete("/api/devices", json={"push_token": "ExponentPushToken[abc]"}).status_code == 200


def test_message_and_answer_push(app, client, sent):
    a = User(client, "Push Sender", "push.sender@example.com")
    b = User(client, "Push Receiver", "push.receiver@example.com")
    b.post("/api/devices", json={"push_token": "ExponentPushToken[live1]", "platform": "android"})
    b.post("/api/devices", json={"push_token": "ExponentPushToken[Dead1]", "platform": "ios"})
    conv = a.post("/api/messages/conversations", json={"user_id": b.id}).get_json()["conversation"]["id"]
    a.post(f"/api/messages/conversations/{conv}", json={"content": "Are you going to the hike?"})
    msgs = sent[-1]
    assert {m["to"] for m in msgs} == {"ExponentPushToken[live1]", "ExponentPushToken[Dead1]"}
    assert msgs[0]["title"] == "Push Sender" and msgs[0]["data"] == {"type": "message", "conversation_id": conv}
    with app.app_context():   # Expo said the Dead token's app is gone
        assert Device.query.filter_by(push_token="ExponentPushToken[Dead1]").first() is None
    pid = b.post("/api/chat/posts", json={"title": "Bus from Jeonju to Seoul?", "content": "Cheapest way"}).get_json()["post"]["id"]
    n = len(sent)
    b.post(f"/api/chat/posts/{pid}/answers", json={"content": "My own follow-up"})
    assert len(sent) == n                                   # no push for answering yourself
    a.post(f"/api/chat/posts/{pid}/answers", json={"content": "Take the express bus"})
    assert sent[-1][0]["title"] == "New answer to your question" and sent[-1][0]["data"]["post_id"] == pid


def test_app_config(client):
    body = client.get("/api/app/config").get_json()
    assert set(body) == {"min_version", "latest_version", "message", "ios_url", "android_url"}
