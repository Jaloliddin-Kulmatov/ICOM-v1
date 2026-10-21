"""The phone app registers itself for push notifications, and asks which
app versions are still supported.

POST   /api/devices {push_token, platform, app_version}
DELETE /api/devices {push_token}           (on sign-out)
GET    /api/app/config                      -> {min_version, latest_version, message}
"""
import os
import re
from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from models import Device

devices_bp = Blueprint("devices", __name__)
app_config_bp = Blueprint("app_config", __name__)

_TOKEN = re.compile(r"^Expo(nent)?PushToken\[[\w\-]+\]$")


@devices_bp.route("", methods=["POST"])
@jwt_required()
def register_device():
    data = request.get_json(silent=True) or {}
    token = (data.get("push_token") or "").strip()
    if not _TOKEN.match(token):
        return jsonify({"error": "Invalid push token."}), 400
    me = int(get_jwt_identity())
    device = Device.query.filter_by(push_token=token).first()
    if device is None:
        device = Device(push_token=token)
        db.session.add(device)
    device.user_id = me          # a phone moves to whoever signed in last
    device.platform = (data.get("platform") or "")[:10]
    device.app_version = (data.get("app_version") or "")[:20]
    device.last_seen = datetime.utcnow()
    db.session.commit()
    return jsonify({"registered": True}), 200


@devices_bp.route("", methods=["DELETE"])
@jwt_required()
def unregister_device():
    token = ((request.get_json(silent=True) or {}).get("push_token") or "").strip()
    Device.query.filter_by(push_token=token, user_id=int(get_jwt_identity())).delete()
    db.session.commit()
    return jsonify({"registered": False}), 200


@app_config_bp.route("/config", methods=["GET"])
def app_config():
    return jsonify({
        "min_version": os.environ.get("APP_MIN_VERSION", "1.0.0"),
        "latest_version": os.environ.get("APP_LATEST_VERSION", "1.0.0"),
        "message": os.environ.get("APP_MESSAGE", ""),
        # Where "Update" sends people. Set once the apps are in the stores.
        "ios_url": os.environ.get("APP_IOS_URL", "https://icom.ai.kr"),
        "android_url": os.environ.get("APP_ANDROID_URL", "https://icom.ai.kr"),
    }), 200


# Crash reports from the phone app. They go to the server log (Render → Logs,
# search "[app-error]"), so no outside service is needed. Throttled per IP.
_error_hits: dict = {}


@app_config_bp.route("/errors", methods=["POST"])
def app_error():
    import time
    ip = (request.headers.get("X-Forwarded-For") or request.remote_addr or "").split(",")[0].strip()
    now = time.time()
    hits = [t for t in _error_hits.get(ip, []) if now - t < 600]
    if len(hits) >= 20:
        return jsonify({"ok": False}), 429
    _error_hits[ip] = hits + [now]

    data = request.get_json(silent=True) or {}
    clip = lambda k, n: re.sub(r"\s+", " ", str(data.get(k) or ""))[:n]   # noqa: E731
    print(f"[app-error] v{clip('version', 20)} {clip('platform', 10)} screen={clip('screen', 80)} "
          f"fatal={bool(data.get('fatal'))} msg={clip('message', 300)} stack={clip('stack', 1200)}")
    return jsonify({"ok": True}), 200
