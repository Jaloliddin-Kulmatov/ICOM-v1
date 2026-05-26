from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import re
import requests as http_requests

from app import db, bcrypt
from models import User

auth_bp = Blueprint("auth", __name__)


def _email_valid(email: str) -> bool:
    return bool(re.match(r"[^@]+@[^@]+\.[^@]+", email))


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    university = (data.get("university") or "").strip()
    visa_type = (data.get("visa_type") or "").strip()
    country = (data.get("country") or "").strip()

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required."}), 400

    if not _email_valid(email):
        return jsonify({"error": "Invalid email address."}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists."}), 409

    password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    user = User(
        name=name,
        email=email,
        password_hash=password_hash,
        university=university,
        visa_type=visa_type,
        country=country,
    )
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "message": "Account created successfully.",
        "token": access_token,
        "user": user.to_dict(),
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid email or password."}), 401

    user.last_seen = datetime.utcnow()
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "message": "Login successful.",
        "token": access_token,
        "user": user.to_dict(),
    }), 200


@auth_bp.route("/google", methods=["POST"])
def google_auth():
    """Sign in / sign up with a Google OAuth access token.

    Frontend sends {access_token, mode} where mode is "login" or "register".
    - mode="login": only signs in existing users. Returns 404 if no account
      so the frontend can prompt the user to sign up.
    - mode="register": creates a new account. Returns 409 if account already
      exists so the frontend can prompt the user to sign in instead.
    - mode missing/other: legacy behaviour — find-or-create (kept for
      backwards compatibility, used by older clients).
    """
    data = request.get_json(silent=True) or {}
    access_token = (data.get("access_token") or "").strip()
    mode = (data.get("mode") or "").strip().lower()

    if not access_token:
        return jsonify({"error": "Google access token is required."}), 400

    # ── Verify token with Google ──────────────────────────────────────────────
    try:
        resp = http_requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
    except Exception:
        return jsonify({"error": "Could not reach Google servers. Try again."}), 503

    if resp.status_code != 200:
        return jsonify({"error": "Invalid or expired Google token."}), 401

    info = resp.json()
    email = (info.get("email") or "").strip().lower()
    name  = (info.get("name") or info.get("given_name") or "").strip()
    if not name:
        name = email.split("@")[0]

    if not email:
        return jsonify({"error": "Could not retrieve email from Google."}), 400

    # ── Email verified check ──────────────────────────────────────────────────
    if not info.get("email_verified", False):
        return jsonify({
            "error": "Your Google email is not verified. "
                     "Please verify your Google account first, then try again."
        }), 400

    # ── Branch on mode ────────────────────────────────────────────────────────
    user = User.query.filter_by(email=email).first()

    if mode == "login":
        # Strict sign-in: refuse to auto-create an account.
        if not user:
            return jsonify({
                "error": "No ICOM account is linked to this Google email. "
                         "Please sign up first.",
                "code": "NO_ACCOUNT",
            }), 404

    elif mode == "register":
        # Strict sign-up: refuse to silently sign in an existing user.
        if user:
            return jsonify({
                "error": "An ICOM account already exists for this Google email. "
                         "Please sign in instead.",
                "code": "ACCOUNT_EXISTS",
            }), 409
        user = User(
            name=name,
            email=email,
            password_hash="",        # no password — Google-only account
            is_verified=True,        # Google has already verified the email
        )
        db.session.add(user)
        db.session.commit()

    else:
        # Legacy / unspecified mode: keep find-or-create behaviour.
        if not user:
            user = User(
                name=name,
                email=email,
                password_hash="",
                is_verified=True,
            )
            db.session.add(user)
            db.session.commit()

    # Touch last_seen if the column exists (returning users).
    if hasattr(user, "last_seen"):
        user.last_seen = datetime.utcnow()
        db.session.commit()

    jwt_token = create_access_token(
        identity=str(user.id),
        expires_delta=timedelta(days=30),
    )
    return jsonify({
        "message": f"Welcome, {user.name}!",
        "token": jwt_token,
        "user": user.to_dict(),
    }), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    return jsonify({"user": user.to_dict()}), 200


@auth_bp.route("/me", methods=["PATCH"])
@jwt_required()
def update_me():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    data = request.get_json(silent=True) or {}

    for field in ("name", "university", "visa_type", "country"):
        value = data.get(field)
        if value is not None:
            setattr(user, field, value.strip())

    db.session.commit()
    return jsonify({"user": user.to_dict()}), 200
