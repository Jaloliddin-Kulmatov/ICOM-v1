"""Push notifications to the ICOM phone app through Expo's push service.

Sending runs in a background thread so a slow push never delays the request
that caused it. Tokens Expo reports as no longer registered are deleted.
"""
import threading

import requests

from app import db
from models import Device

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def _send(flask_app, tokens: list[str], title: str, body: str, data: dict):
    messages = [{"to": t, "title": title, "body": body[:180], "data": data, "sound": "default"} for t in tokens]
    try:
        resp = requests.post(EXPO_PUSH_URL, json=messages, timeout=15,
                             headers={"Accept": "application/json", "Content-Type": "application/json"})
        tickets = (resp.json() or {}).get("data") or []
    except Exception as e:  # noqa: BLE001 — network trouble must never break the app
        print(f"[push] send failed: {e}")
        return
    dead = [tokens[i] for i, t in enumerate(tickets)
            if i < len(tokens) and t.get("status") == "error"
            and (t.get("details") or {}).get("error") == "DeviceNotRegistered"]
    if dead:
        with flask_app.app_context():
            Device.query.filter(Device.push_token.in_(dead)).delete(synchronize_session=False)
            db.session.commit()


def notify_user(user_id: int, title: str, body: str, data: dict | None = None):
    """Push to every phone of one user. Safe to call inside a request."""
    from flask import current_app
    tokens = [d.push_token for d in Device.query.filter_by(user_id=user_id).all()]
    if not tokens:
        return
    flask_app = current_app._get_current_object()
    threading.Thread(target=_send, args=(flask_app, tokens, title, body, data or {}),
                     daemon=True, name="push").start()
