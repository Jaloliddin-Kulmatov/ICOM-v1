from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request

from app import db
from models import Feedback, User

feedback_bp = Blueprint("feedback", __name__)


def _current_user():
    """Return the authenticated User instance, or None if not signed in."""
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if identity:
            return User.query.get(int(identity))
    except Exception:
        return None
    return None


# ── Submit feedback (open — anyone can post, with rate-limit-style guards) ──

@feedback_bp.route("", methods=["POST"])
def create_feedback():
    data = request.get_json(silent=True) or {}

    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"error": "Please write a message before submitting."}), 400
    if len(message) > 2000:
        return jsonify({"error": "Message too long (max 2000 characters)."}), 400

    rating = data.get("rating")
    if rating is not None:
        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                rating = None
        except (TypeError, ValueError):
            rating = None

    name = (data.get("name") or "").strip()[:120] or None
    email = (data.get("email") or "").strip()[:200] or None
    page_url = (data.get("page_url") or "").strip()[:500] or None

    user = _current_user()
    fb = Feedback(
        user_id=user.id if user else None,
        name=name,
        email=email,
        rating=rating,
        message=message,
        page_url=page_url,
    )
    db.session.add(fb)
    db.session.commit()
    return jsonify({"feedback": fb.to_dict(), "message": "Thanks for the feedback!"}), 201


# ── Admin: list all feedback (newest first) ────────────────────────────────

@feedback_bp.route("", methods=["GET"])
@jwt_required()
def list_feedback():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    if user.role != "admin":
        return jsonify({"error": "Admin access required."}), 403

    items = Feedback.query.order_by(Feedback.created_at.desc()).limit(500).all()
    return jsonify({"feedback": [f.to_dict() for f in items]}), 200


# ── Admin: delete feedback ─────────────────────────────────────────────────

@feedback_bp.route("/<int:fb_id>", methods=["DELETE"])
@jwt_required()
def delete_feedback(fb_id):
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    if user.role != "admin":
        return jsonify({"error": "Admin access required."}), 403

    fb = Feedback.query.get_or_404(fb_id)
    db.session.delete(fb)
    db.session.commit()
    return jsonify({"message": "Deleted."}), 200
