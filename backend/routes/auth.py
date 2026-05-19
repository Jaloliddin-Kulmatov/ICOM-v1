from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime
import re

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
