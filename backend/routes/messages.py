"""Direct messages between students, plus block and report.

/api/messages
  GET  /conversations                 -> my conversations, newest first, with unread counts
  POST /conversations {user_id}       -> open (or reuse) a conversation with someone
  GET  /conversations/<id>?after=<n>  -> messages (marks the other person's as read)
  POST /conversations/<id> {content}  -> send a message
  GET  /unread                        -> total unread messages (for badges)
/api/users
  GET    /<id>                        -> public profile card (no email)
  POST   /<id>/block, DELETE /<id>/block
  POST   /reports {target_type, target_id, reason}
  GET    /reports                     -> admin only
"""
import time
from collections import defaultdict, deque
from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_, func

from app import db
from models import User, Conversation, DirectMessage, UserBlock, Report

messages_bp = Blueprint("messages", __name__)
users_bp = Blueprint("users", __name__)

MAX_MESSAGE_CHARS = 2000
RATE_LIMIT = 20          # messages
RATE_WINDOW = 60         # seconds
_recent_sends: dict[int, deque] = defaultdict(deque)


def _me() -> int:
    return int(get_jwt_identity())


def _public_profile(u: User) -> dict:
    return {
        "id": u.id,
        "name": u.name,
        "university": u.university or "",
        "country": u.country or "",
        "visa_type": u.visa_type or "",
        "role": u.role,
        "member_since": u.created_at.isoformat() + "Z" if u.created_at else None,
    }


def _blocked_between(a: int, b: int) -> bool:
    return UserBlock.query.filter(
        or_((UserBlock.blocker_id == a) & (UserBlock.blocked_id == b),
            (UserBlock.blocker_id == b) & (UserBlock.blocked_id == a))
    ).first() is not None


def _my_conversation(conv_id: int, me: int):
    conv = Conversation.query.get(conv_id)
    if conv is None or me not in (conv.user_a_id, conv.user_b_id):
        return None
    return conv


def _rate_limited(me: int) -> bool:
    now = time.time()
    q = _recent_sends[me]
    while q and now - q[0] > RATE_WINDOW:
        q.popleft()
    if len(q) >= RATE_LIMIT:
        return True
    q.append(now)
    return False


# ── Conversations ─────────────────────────────────────────────────────────────

@messages_bp.route("/conversations", methods=["GET"])
@jwt_required()
def list_conversations():
    me = _me()
    convs = (Conversation.query
             .filter(or_(Conversation.user_a_id == me, Conversation.user_b_id == me))
             .order_by(Conversation.last_message_at.desc())
             .limit(100).all())
    if not convs:
        return jsonify({"conversations": []}), 200

    ids = [c.id for c in convs]
    others = {u.id: u for u in User.query.filter(User.id.in_([c.other_id(me) for c in convs])).all()}
    unread = dict(db.session.query(DirectMessage.conversation_id, func.count(DirectMessage.id))
                  .filter(DirectMessage.conversation_id.in_(ids), DirectMessage.sender_id != me,
                          DirectMessage.read_at.is_(None))
                  .group_by(DirectMessage.conversation_id).all())
    blocked = {b.blocked_id for b in UserBlock.query.filter_by(blocker_id=me).all()}

    out = []
    for c in convs:
        other = others.get(c.other_id(me))
        if other is None:
            continue
        last = (DirectMessage.query.filter_by(conversation_id=c.id)
                .order_by(DirectMessage.id.desc()).first())
        out.append({
            "id": c.id,
            "other": _public_profile(other),
            "last_message": last.to_dict() if last else None,
            "unread": int(unread.get(c.id, 0)),
            "blocked_by_me": other.id in blocked,
            "updated_at": c.last_message_at.isoformat() + "Z",
        })
    return jsonify({"conversations": out}), 200


@messages_bp.route("/conversations", methods=["POST"])
@jwt_required()
def open_conversation():
    me = _me()
    try:
        other_id = int((request.get_json(silent=True) or {}).get("user_id"))
    except (TypeError, ValueError):
        return jsonify({"error": "Choose who to message."}), 400
    if other_id == me:
        return jsonify({"error": "You can't message yourself."}), 400
    other = User.query.get(other_id)
    if other is None:
        return jsonify({"error": "That student wasn't found."}), 404
    if _blocked_between(me, other_id):
        return jsonify({"error": "You can't message this person."}), 403

    a, b = sorted((me, other_id))
    conv = Conversation.query.filter_by(user_a_id=a, user_b_id=b).first()
    created = conv is None
    if created:
        conv = Conversation(user_a_id=a, user_b_id=b)
        db.session.add(conv)
        db.session.commit()
    return jsonify({"conversation": {"id": conv.id, "other": _public_profile(other)}}), 201 if created else 200


@messages_bp.route("/conversations/<int:conv_id>", methods=["GET"])
@jwt_required()
def get_messages(conv_id):
    me = _me()
    conv = _my_conversation(conv_id, me)
    if conv is None:
        return jsonify({"error": "Conversation not found."}), 404
    after = request.args.get("after", 0, type=int)
    q = DirectMessage.query.filter(DirectMessage.conversation_id == conv.id, DirectMessage.id > after)
    msgs = q.order_by(DirectMessage.id.asc()).limit(200).all()

    # Mark what the other person sent as read now that I've opened it.
    now = datetime.utcnow()
    changed = False
    for m in msgs:
        if m.sender_id != me and m.read_at is None:
            m.read_at = now
            changed = True
    if changed:
        db.session.commit()

    other = User.query.get(conv.other_id(me))
    return jsonify({
        "conversation": {
            "id": conv.id,
            "other": _public_profile(other) if other else None,
            "blocked": _blocked_between(me, conv.other_id(me)),
            "blocked_by_me": UserBlock.query.filter_by(blocker_id=me, blocked_id=conv.other_id(me)).first() is not None,
            # Highest id of MY messages the other person has read (for "Seen").
            "other_read_up_to": db.session.query(func.max(DirectMessage.id)).filter(
                DirectMessage.conversation_id == conv.id, DirectMessage.sender_id == me,
                DirectMessage.read_at.isnot(None)).scalar() or 0,
        },
        "messages": [m.to_dict() for m in msgs],
    }), 200


@messages_bp.route("/conversations/<int:conv_id>", methods=["POST"])
@jwt_required()
def send_message(conv_id):
    me = _me()
    conv = _my_conversation(conv_id, me)
    if conv is None:
        return jsonify({"error": "Conversation not found."}), 404
    content = ((request.get_json(silent=True) or {}).get("content") or "").strip()
    if not content:
        return jsonify({"error": "Message can't be empty."}), 400
    if len(content) > MAX_MESSAGE_CHARS:
        return jsonify({"error": f"Message is too long (max {MAX_MESSAGE_CHARS} characters)."}), 400
    if _blocked_between(me, conv.other_id(me)):
        return jsonify({"error": "You can't message this person."}), 403

    from routes.chat import _is_safe
    ok, _term = _is_safe(content)
    if not ok:
        return jsonify({"error": "This message breaks the community rules and wasn't sent."}), 400
    if _rate_limited(me):
        return jsonify({"error": "You're sending messages too quickly. Wait a minute and try again."}), 429

    msg = DirectMessage(conversation_id=conv.id, sender_id=me, content=content)
    conv.last_message_at = datetime.utcnow()
    db.session.add(msg)
    db.session.commit()
    from push import notify_user
    sender = User.query.get(me)
    notify_user(conv.other_id(me), sender.name if sender else "New message", content,
                {"type": "message", "conversation_id": conv.id})
    return jsonify({"message": msg.to_dict()}), 201


@messages_bp.route("/unread", methods=["GET"])
@jwt_required()
def unread_count():
    me = _me()
    conv_ids = [c.id for c in Conversation.query.with_entities(Conversation.id)
                .filter(or_(Conversation.user_a_id == me, Conversation.user_b_id == me)).all()]
    if not conv_ids:
        return jsonify({"unread": 0}), 200
    n = (DirectMessage.query.filter(DirectMessage.conversation_id.in_(conv_ids),
                                    DirectMessage.sender_id != me, DirectMessage.read_at.is_(None)).count())
    return jsonify({"unread": n}), 200


# ── People: profile, block, report ────────────────────────────────────────────

SEARCH_LIMIT = 30         # searches
SEARCH_WINDOW = 60        # seconds
_recent_searches: dict[int, deque] = defaultdict(deque)


@users_bp.route("/search", methods=["GET"])
@jwt_required()
def search_users():
    """Find students by name to message them. Signed-in only, name only (never
    email), at least 2 characters, no one you've blocked or who blocked you."""
    me = _me()
    q = " ".join((request.args.get("q") or "").split())[:60]
    if len(q) < 2:
        return jsonify({"users": []}), 200
    now = time.time()
    hits = _recent_searches[me]
    while hits and now - hits[0] > SEARCH_WINDOW:
        hits.popleft()
    if len(hits) >= SEARCH_LIMIT:
        return jsonify({"error": "Too many searches. Wait a minute and try again."}), 429
    hits.append(now)

    blocked = {b.blocked_id for b in UserBlock.query.filter_by(blocker_id=me).all()} | \
              {b.blocker_id for b in UserBlock.query.filter_by(blocked_id=me).all()}
    pattern = "%" + q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"
    rows = (User.query.filter(User.name.ilike(pattern, escape="\\"), User.id != me)
            .order_by(User.name.asc()).limit(40).all())
    # Names that start with the query first, then the rest.
    low = q.lower()
    rows.sort(key=lambda u: (not (u.name or "").lower().startswith(low), (u.name or "").lower()))
    return jsonify({"users": [_public_profile(u) for u in rows if u.id not in blocked][:20]}), 200


@users_bp.route("/<int:user_id>", methods=["GET"])
@jwt_required()
def public_profile(user_id):
    u = User.query.get(user_id)
    if u is None:
        return jsonify({"error": "That student wasn't found."}), 404
    return jsonify({"user": _public_profile(u)}), 200


@users_bp.route("/<int:user_id>/block", methods=["POST"])
@jwt_required()
def block_user(user_id):
    me = _me()
    if user_id == me:
        return jsonify({"error": "You can't block yourself."}), 400
    if User.query.get(user_id) is None:
        return jsonify({"error": "That student wasn't found."}), 404
    if not UserBlock.query.filter_by(blocker_id=me, blocked_id=user_id).first():
        db.session.add(UserBlock(blocker_id=me, blocked_id=user_id))
        db.session.commit()
    return jsonify({"blocked": True}), 200


@users_bp.route("/<int:user_id>/block", methods=["DELETE"])
@jwt_required()
def unblock_user(user_id):
    me = _me()
    UserBlock.query.filter_by(blocker_id=me, blocked_id=user_id).delete()
    db.session.commit()
    return jsonify({"blocked": False}), 200


REPORT_TYPES = {"message", "user", "chat_post", "chat_answer", "club"}


@users_bp.route("/reports", methods=["POST"])
@jwt_required()
def create_report():
    me = _me()
    data = request.get_json(silent=True) or {}
    target_type = (data.get("target_type") or "").strip()
    try:
        target_id = int(data.get("target_id"))
    except (TypeError, ValueError):
        target_id = 0
    if target_type not in REPORT_TYPES or target_id <= 0:
        return jsonify({"error": "Say what you're reporting."}), 400
    if target_type == "message":
        msg = DirectMessage.query.get(target_id)
        conv = Conversation.query.get(msg.conversation_id) if msg else None
        if conv is None or me not in (conv.user_a_id, conv.user_b_id):
            return jsonify({"error": "Message not found."}), 404
    db.session.add(Report(reporter_id=me, target_type=target_type, target_id=target_id,
                          reason=(data.get("reason") or "").strip()[:500]))
    db.session.commit()
    return jsonify({"message": "Thanks. An admin will review this report."}), 201


@users_bp.route("/reports", methods=["GET"])
@jwt_required()
def list_reports():
    me = User.query.get(_me())
    if me is None or me.role != "admin":
        return jsonify({"error": "Admin access required."}), 403
    rows = Report.query.order_by(Report.created_at.desc()).limit(200).all()
    return jsonify({"reports": [{
        "id": r.id, "reporter_id": r.reporter_id, "target_type": r.target_type,
        "target_id": r.target_id, "reason": r.reason, "status": r.status,
        "created_at": r.created_at.isoformat() + "Z",
    } for r in rows]}), 200
