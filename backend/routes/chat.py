"""
Reddit-style Q&A board for ICOM.

Routes (all under /api/chat):
  GET    /posts             — list active questions, newest first
  POST   /posts             — create a new question (JWT)
  GET    /posts/<id>        — single post + its answers
  POST   /posts/<id>/answers — add an answer (JWT)
  DELETE /posts/<id>        — soft-delete your own post (JWT)
  DELETE /answers/<id>      — soft-delete your own answer (JWT)

Every text field passes through `_is_safe()` first. Posts containing
flagged content are refused with a 400 (and printed to logs) so the
banned content never lands in the DB.
"""

import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from models import ChatPost, ChatAnswer, User

chat_bp = Blueprint("chat", __name__)


# ── Content moderation ────────────────────────────────────────────────────────

# Banned keyword list. Conservative — only the clearest categories. We match
# on word boundaries so legitimate words containing these letters (e.g.
# "sextant", "Essex") don't trip the filter.
_BANNED_PATTERNS = [
    # English — sexual / explicit
    r"\bporn(?:ography)?\b", r"\bxxx\b", r"\bnsfw\b",
    r"\bmasturbat\w*\b", r"\bfetish\b",
    r"\bsex(?:ual|ually|y|ting)?\b", r"\bnude\b", r"\bnaked\b",
    r"\bescort\b", r"\bprostitut\w*\b", r"\bbrothel\b",
    r"\bhooker\b", r"\bwhore\b", r"\bslut\b",
    r"\bonlyfans\b",
    # English — terrorism / violence
    r"\bterror(?:ist|ism)?\b", r"\bbomb(?:ing)?\b",
    r"\bbehead\w*\b", r"\bjihad\b", r"\bisis\b",
    r"\bkill\s+(?:you|him|her|them|me|us)\b",   # threats only, not casual "kill it"
    r"\bsuicide\s+bomb\w*\b", r"\bmass\s+shoot\w*\b",
    # English — child-related abuse
    r"\bcp\b\s+(?:images|video)", r"\bchild\s+porn\w*\b",
    # Drugs (hard drugs only — leaving soft mentions alone)
    r"\bcocaine\b", r"\bheroin\b", r"\bmeth(?:amphetamine)?\b",
    r"\bfentanyl\b",
    # Korean — sexual
    "포르노", "야동", "성인물", "야사",
    # Korean — terrorism / violence
    "테러", "폭탄테러", "테러리스트",
]

_BANNED_REGEX = re.compile(
    "|".join(_BANNED_PATTERNS), flags=re.IGNORECASE
)


def _is_safe(*texts: str) -> tuple[bool, str]:
    """Returns (is_safe, matched_term_or_empty). True when none of the
    provided text blocks contain any banned pattern."""
    for t in texts:
        if not t:
            continue
        m = _BANNED_REGEX.search(t)
        if m:
            return (False, m.group(0))
    return (True, "")


# ── Helpers ───────────────────────────────────────────────────────────────────

def _current_user() -> User | None:
    try:
        uid = int(get_jwt_identity())
        return User.query.get(uid)
    except Exception:
        return None


def _validate_image(url: str) -> tuple[bool, str]:
    """Allow either http(s) URLs or data: URLs. Cap total length at ~600KB
    so a base64-encoded 450KB image fits but anything bigger is rejected."""
    if not url:
        return (True, "")  # optional
    url = url.strip()
    if len(url) > 600_000:
        return (False, "Image is too large (max ~450 KB). Please compress and try again.")
    if url.startswith("data:image/"):
        return (True, url)
    if url.startswith("http://") or url.startswith("https://"):
        return (True, url)
    return (False, "Image must be an http(s) link or an uploaded picture.")


# ── Routes ────────────────────────────────────────────────────────────────────

@chat_bp.route("/posts", methods=["GET"])
def list_posts():
    posts = (
        ChatPost.query.filter_by(is_active=True)
        .order_by(ChatPost.created_at.desc())
        .limit(100)
        .all()
    )
    return jsonify({"posts": [p.to_dict() for p in posts]}), 200


@chat_bp.route("/posts/<int:post_id>", methods=["GET"])
def get_post(post_id: int):
    post = ChatPost.query.filter_by(id=post_id, is_active=True).first()
    if not post:
        return jsonify({"error": "Post not found or removed."}), 404
    return jsonify({"post": post.to_dict(include_answers=True)}), 200


@chat_bp.route("/posts", methods=["POST"])
@jwt_required()
def create_post():
    user = _current_user()
    if not user:
        return jsonify({"error": "Sign in required."}), 401

    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    content = (data.get("content") or "").strip()
    image_url = (data.get("image_url") or "").strip()

    if not title or not content:
        return jsonify({"error": "Title and question are both required."}), 400
    if len(title) > 200:
        return jsonify({"error": "Title is too long (max 200 chars)."}), 400
    if len(content) > 5000:
        return jsonify({"error": "Question is too long (max 5000 chars)."}), 400

    safe, hit = _is_safe(title, content)
    if not safe:
        print(f"[chat] blocked post from user {user.id} — matched '{hit}'")
        return jsonify({
            "error": (
                "Your post was blocked because it contains content that isn't "
                "allowed (matched: '" + hit + "'). ICOM Chat is a safe space for "
                "international students — please rephrase and try again."
            )
        }), 400

    img_ok, img_or_err = _validate_image(image_url)
    if not img_ok:
        return jsonify({"error": img_or_err}), 400

    post = ChatPost(
        user_id=user.id,
        title=title,
        content=content,
        image_url=img_or_err if image_url else "",
        is_active=True,
    )
    db.session.add(post)
    db.session.commit()
    return jsonify({"post": post.to_dict(include_answers=True)}), 201


@chat_bp.route("/posts/<int:post_id>/answers", methods=["POST"])
@jwt_required()
def add_answer(post_id: int):
    user = _current_user()
    if not user:
        return jsonify({"error": "Sign in required."}), 401

    post = ChatPost.query.filter_by(id=post_id, is_active=True).first()
    if not post:
        return jsonify({"error": "Post not found or removed."}), 404

    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "Answer cannot be empty."}), 400
    if len(content) > 3000:
        return jsonify({"error": "Answer is too long (max 3000 chars)."}), 400

    safe, hit = _is_safe(content)
    if not safe:
        print(f"[chat] blocked answer from user {user.id} on post {post_id} — matched '{hit}'")
        return jsonify({
            "error": (
                "Your answer was blocked because it contains content that isn't "
                "allowed (matched: '" + hit + "'). Please rephrase and try again."
            )
        }), 400

    ans = ChatAnswer(
        post_id=post_id, user_id=user.id, content=content, is_active=True
    )
    db.session.add(ans)
    db.session.commit()
    return jsonify({"answer": ans.to_dict()}), 201


@chat_bp.route("/posts/<int:post_id>", methods=["DELETE"])
@jwt_required()
def delete_post(post_id: int):
    user = _current_user()
    if not user:
        return jsonify({"error": "Sign in required."}), 401
    post = ChatPost.query.filter_by(id=post_id).first()
    if not post:
        return jsonify({"error": "Post not found."}), 404
    if post.user_id != user.id and user.role != "admin":
        return jsonify({"error": "You can only delete your own posts."}), 403
    post.is_active = False
    db.session.commit()
    return jsonify({"message": "Post removed."}), 200


@chat_bp.route("/answers/<int:answer_id>", methods=["DELETE"])
@jwt_required()
def delete_answer(answer_id: int):
    user = _current_user()
    if not user:
        return jsonify({"error": "Sign in required."}), 401
    ans = ChatAnswer.query.filter_by(id=answer_id).first()
    if not ans:
        return jsonify({"error": "Answer not found."}), 404
    if ans.user_id != user.id and user.role != "admin":
        return jsonify({"error": "You can only delete your own answers."}), 403
    ans.is_active = False
    db.session.commit()
    return jsonify({"message": "Answer removed."}), 200
