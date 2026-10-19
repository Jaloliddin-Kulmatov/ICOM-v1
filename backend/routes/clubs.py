from collections import defaultdict

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from sqlalchemy.orm import joinedload

from app import db
from models import Club, ClubMembership, User, ClubMessage, ClubEvent
import response_cache
from club_categories import normalize as normalize_category

clubs_bp = Blueprint("clubs", __name__)

# ── University alias table ────────────────────────────────────
# Maps every canonical short-name to a list of known variants so that
# "JBNU", "jbnu", "Jeonbuk National University", "전북대" all match.
_UNI_ALIASES: dict[str, list[str]] = {
    "jbnu":     ["jbnu", "jeonbuk", "전북대", "전북국립대", "전북대학교"],
    "snu":      ["snu", "seoul national", "서울대", "서울국립대"],
    "yonsei":   ["yonsei", "연세", "연세대"],
    "korea":    ["korea university", "고려대", "고대", "koryo"],
    "hanyang":  ["hanyang", "한양", "한양대"],
    "skku":     ["skku", "sungkyunkwan", "성균관", "성균관대"],
    "ewha":     ["ewha", "이화", "이화여대"],
    "kyung hee":["kyung hee", "kyunghee", "경희", "경희대"],
    "sogang":   ["sogang", "서강", "서강대"],
    "chung-ang":["chung-ang", "chungang", "중앙", "중앙대", "cau"],
    "inha":     ["inha", "인하", "인하대"],
    "pnu":      ["pnu", "pusan national", "부산대", "부산국립대"],
    "konkuk":   ["konkuk", "건국", "건국대"],
    "hongik":   ["hongik", "홍익", "홍대"],
    "sejong":   ["sejong", "세종", "세종대"],
    "dongguk":  ["dongguk", "동국", "동국대"],
    "cnu":      ["cnu", "chungnam national", "충남대"],
    "ajou":     ["ajou", "아주", "아주대"],
}

def _uni_matches(user_uni: str, club_uni: str) -> bool:
    """Return True if the two university strings refer to the same institution.
    Handles abbreviations, full names, Korean names, and case differences."""
    u = user_uni.lower().strip()
    c = club_uni.lower().strip()
    if not u or not c:
        return False
    if u == c:
        return True
    # substring containment (e.g. "jbnu" ⊂ "jbnu international students")
    if u in c or c in u:
        return True
    # alias table lookup
    for _canonical, variants in _UNI_ALIASES.items():
        u_hit = any(v in u for v in variants)
        c_hit = any(v in c for v in variants)
        if u_hit and c_hit:
            return True
    return False


def _current_user_id():
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        return int(identity) if identity else None
    except Exception:
        return None


# ── Fast counts (no auth needed) ─────────────────────────────

@clubs_bp.route("/counts", methods=["GET"])
def club_counts():
    from sqlalchemy import func

    def build():
        rows = (
            db.session.query(Club.club_type, func.count(Club.id))
            .filter_by(is_active=True)
            .group_by(Club.club_type)
            .all()
        )
        result = {"clubs": 0, "communities": 0}
        for ctype, cnt in rows:
            result["communities" if ctype == "community" else "clubs"] += cnt
        return result

    return jsonify(response_cache.cached("clubs:counts", 120, build)), 200


# ── List clubs ────────────────────────────────────────────────
# Rules:
#   club_type == "community"  → visible to every authenticated user
#   club_type == "club"       → visible only to users whose university
#                               matches the club's university field (flexible)
#   unauthenticated request   → communities only

def _club_directory():
    """Every active club with its public fields, member statuses and private
    contact details, built with two queries and cached until a club or
    membership changes (response_cache drops it on commit)."""
    def build():
        clubs = (Club.query.options(joinedload(Club.creator))
                 .filter_by(is_active=True).order_by(Club.created_at.desc()).all())
        memberships = defaultdict(list)
        if clubs:
            for m in ClubMembership.query.filter(ClubMembership.club_id.in_([c.id for c in clubs])).all():
                memberships[m.club_id].append(m)
        return [{
            # user_id=0 matches nobody, so the shared copy never carries private fields
            "base": c.to_dict(user_id=0, _memberships=memberships[c.id]),
            "private": {"kakao_link": c.kakao_link, "contact": c.contact},
            "members": {m.user_id: m.status for m in memberships[c.id]},
            "pending": sum(1 for m in memberships[c.id] if m.status == "pending"),
            "created_by": c.created_by,
            "type": (c.club_type or "club").lower(),
            "university": c.university or "",
        } for c in clubs]
    return response_cache.cached("clubs:directory", 300, build)


def _user_university(user_id):
    def build():
        u = db.session.get(User, user_id)
        return (u.university or "").strip() if u else ""
    return response_cache.cached(f"user:{user_id}:uni", 300, build) if user_id else ""


def _personalise(entry: dict, user_id) -> dict:
    d = dict(entry["base"])
    status = entry["members"].get(user_id) if user_id else None
    is_creator = bool(user_id) and entry["created_by"] == user_id
    d["my_status"] = status
    d["is_creator"] = is_creator
    if is_creator:
        d["pending_count"] = entry["pending"]
    if status == "approved" or is_creator:
        d.update(entry["private"])
    return d


@clubs_bp.route("", methods=["GET"])
def list_clubs():
    user_id = _current_user_id()
    user_uni = _user_university(user_id)
    visible = [e for e in _club_directory()
               if e["type"] == "community" or (user_uni and _uni_matches(user_uni, e["university"]))]
    return jsonify({"clubs": [_personalise(e, user_id) for e in visible]}), 200


# ── Create a club (any authenticated user) ───────────────────

@clubs_bp.route("", methods=["POST"])
@jwt_required()
def create_club():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Club name is required."}), 400

    club_type_val = (data.get("club_type") or "club").strip()
    # Communities are nationwide — don't default their university to JBNU.
    # Clubs without a university supplied still default to JBNU.
    default_uni = "" if club_type_val == "community" else "JBNU"

    club = Club(
        name=name,
        description=(data.get("description") or "").strip(),
        category=normalize_category(data.get("category"), club_type_val),
        university=(data.get("university") or default_uni).strip(),
        kakao_link=(data.get("kakao_link") or "").strip(),
        contact=(data.get("contact") or "").strip(),
        meeting_time=(data.get("meeting_time") or "").strip(),
        location=(data.get("location") or "").strip(),
        club_type=club_type_val,
        country=(data.get("country") or "").strip(),
        created_by=user_id,
    )
    db.session.add(club)
    db.session.commit()
    return jsonify({"club": club.to_dict(user_id=user_id)}), 201


# ── Request to join (auto-approved for now) ───────────────────

@clubs_bp.route("/<int:club_id>/request", methods=["POST"])
@jwt_required()
def request_join(club_id):
    user_id = int(get_jwt_identity())
    club = Club.query.get_or_404(club_id)
    if not club.is_active:
        return jsonify({"error": "Club not found."}), 404
    if club.created_by == user_id:
        return jsonify({"error": "You are the creator."}), 400

    existing = ClubMembership.query.filter_by(user_id=user_id, club_id=club_id).first()
    if existing:
        # If they were stuck in "pending" from before this change, promote
        # them to approved so nobody is permanently waiting.
        if existing.status != "approved":
            existing.status = "approved"
            db.session.commit()
            return jsonify({
                "message": "Welcome! You're now a member.",
                "club": club.to_dict(user_id=user_id),
            }), 200
        return jsonify({"error": "Already a member.", "status": existing.status}), 409

    # Auto-approve every join request for now — no creator review step.
    # (Flip back to status="pending" if/when we want gated joining.)
    membership = ClubMembership(user_id=user_id, club_id=club_id, status="approved")
    db.session.add(membership)
    db.session.commit()
    return jsonify({
        "message": "Welcome! You're now a member.",
        "club": club.to_dict(user_id=user_id),
    }), 200


# ── Leave a club ──────────────────────────────────────────────

@clubs_bp.route("/<int:club_id>/leave", methods=["POST"])
@jwt_required()
def leave_club(club_id):
    user_id = int(get_jwt_identity())
    membership = ClubMembership.query.filter_by(user_id=user_id, club_id=club_id).first()
    if not membership:
        return jsonify({"error": "Not a member."}), 404
    db.session.delete(membership)
    db.session.commit()
    club = Club.query.get_or_404(club_id)
    return jsonify({"message": "Left club.", "club": club.to_dict(user_id=user_id)}), 200


# ── Get pending requests (creator only) ──────────────────────

@clubs_bp.route("/<int:club_id>/requests", methods=["GET"])
@jwt_required()
def get_requests(club_id):
    user_id = int(get_jwt_identity())
    club = Club.query.get_or_404(club_id)
    if club.created_by != user_id:
        return jsonify({"error": "Only the club creator can view requests."}), 403

    pending = ClubMembership.query.filter_by(club_id=club_id, status="pending").all()
    result = []
    for m in pending:
        u = User.query.get(m.user_id)
        if u:
            result.append({
                "membership_id": m.id,
                "user_id": u.id,
                "name": u.name,
                "email": u.email,
                "university": u.university,
                "country": u.country,
                "visa_type": u.visa_type,
                "requested_at": m.joined_at.isoformat() + "Z",
            })
    return jsonify({"requests": result}), 200


# ── Approve / reject ──────────────────────────────────────────

@clubs_bp.route("/<int:club_id>/approve/<int:target_user_id>", methods=["POST"])
@jwt_required()
def approve_member(club_id, target_user_id):
    user_id = int(get_jwt_identity())
    club = Club.query.get_or_404(club_id)
    if club.created_by != user_id:
        return jsonify({"error": "Only the club creator can approve members."}), 403

    membership = ClubMembership.query.filter_by(club_id=club_id, user_id=target_user_id).first()
    if not membership:
        return jsonify({"error": "No request found."}), 404

    membership.status = "approved"
    db.session.commit()
    return jsonify({"message": "Member approved."}), 200


@clubs_bp.route("/<int:club_id>/reject/<int:target_user_id>", methods=["POST"])
@jwt_required()
def reject_member(club_id, target_user_id):
    user_id = int(get_jwt_identity())
    club = Club.query.get_or_404(club_id)
    if club.created_by != user_id:
        return jsonify({"error": "Only the club creator can reject members."}), 403

    membership = ClubMembership.query.filter_by(club_id=club_id, user_id=target_user_id).first()
    if not membership:
        return jsonify({"error": "No request found."}), 404

    db.session.delete(membership)
    db.session.commit()
    return jsonify({"message": "Request rejected."}), 200


# ── Get approved members (creator or any approved member) ─────

@clubs_bp.route("/<int:club_id>/members", methods=["GET"])
@jwt_required()
def get_members(club_id):
    user_id = int(get_jwt_identity())
    club = Club.query.get_or_404(club_id)

    is_creator  = club.created_by == user_id
    is_approved = ClubMembership.query.filter_by(
        club_id=club_id, user_id=user_id, status="approved"
    ).first() is not None

    if not is_creator and not is_approved:
        return jsonify({"error": "Only club members can view the member list."}), 403

    approved = ClubMembership.query.filter_by(club_id=club_id, status="approved").all()
    result = []
    for m in approved:
        u = User.query.get(m.user_id)
        if u:
            # If this approved member is also the creator, tag them so the
            # frontend can render the crown badge.
            is_owner = u.id == club.created_by
            result.append({
                "membership_id": m.id,
                "user_id": u.id,
                "name": u.name + (" (Creator)" if is_owner else ""),
                "university": u.university,
                "country": u.country,
                "visa_type": u.visa_type,
                "joined_at": m.joined_at.isoformat() + "Z",
            })

    # Always include the creator at the top of the list (if not already in it)
    creator_ids = {r["user_id"] for r in result}
    if club.created_by not in creator_ids:
        creator_user = User.query.get(club.created_by)
        if creator_user:
            result.insert(0, {
                "membership_id": None,
                "user_id": creator_user.id,
                "name": creator_user.name + " (Creator)",
                "university": creator_user.university,
                "country": creator_user.country,
                "visa_type": creator_user.visa_type,
                "joined_at": club.created_at.isoformat() + "Z",
            })
    else:
        # Creator is already in the list — move them to the top
        result.sort(key=lambda r: 0 if r["user_id"] == club.created_by else 1)

    return jsonify({"members": result, "is_creator": is_creator}), 200


# ── My clubs (created + joined) ───────────────────────────────

@clubs_bp.route("/mine", methods=["GET"])
@jwt_required()
def my_clubs():
    user_id = int(get_jwt_identity())
    created = Club.query.filter_by(created_by=user_id, is_active=True).all()
    memberships = ClubMembership.query.filter_by(user_id=user_id).all()
    joined_clubs = [m.club for m in memberships if m.club and m.club.is_active]

    return jsonify({
        "created": [c.to_dict(user_id=user_id) for c in created],
        "joined": [c.to_dict(user_id=user_id) for c in joined_clubs],
    }), 200


# ── Get a single club (public) ───────────────────────────────

@clubs_bp.route("/<int:club_id>", methods=["GET"])
def get_club(club_id):
    user_id = _current_user_id()
    club = Club.query.get_or_404(club_id)
    if not club.is_active:
        return jsonify({"error": "Club not found."}), 404
    return jsonify({"club": club.to_dict(user_id=user_id)}), 200


# ── Edit a club (creator only) ────────────────────────────────

@clubs_bp.route("/<int:club_id>", methods=["PATCH"])
@jwt_required()
def edit_club(club_id):
    user_id = int(get_jwt_identity())
    club = Club.query.get_or_404(club_id)

    if club.created_by != user_id:
        return jsonify({"error": "Only the club creator can edit this club."}), 403

    data = request.get_json(silent=True) or {}
    editable = ["name", "description", "category", "meeting_time",
                "location", "contact", "kakao_link", "website", "country", "cover_image"]
    for field in editable:
        if field in data:
            setattr(club, field, (data[field] or "").strip())
    if "category" in data:
        club.category = normalize_category(data["category"], club.club_type)

    db.session.commit()
    return jsonify({"club": club.to_dict(user_id=user_id)}), 200


# ── Delete a club (creator only, soft-delete) ─────────────────

@clubs_bp.route("/<int:club_id>", methods=["DELETE"])
@jwt_required()
def delete_club(club_id):
    user_id = int(get_jwt_identity())
    club = Club.query.get_or_404(club_id)
    if club.created_by != user_id:
        return jsonify({"error": "Only the club creator can delete this club."}), 403
    club.is_active = False
    db.session.commit()
    return jsonify({"message": "Club deleted."}), 200


# ── Kick a member (creator only) ─────────────────────────────

@clubs_bp.route("/<int:club_id>/kick/<int:target_user_id>", methods=["DELETE"])
@jwt_required()
def kick_member(club_id, target_user_id):
    user_id = int(get_jwt_identity())
    club = Club.query.get_or_404(club_id)
    if club.created_by != user_id:
        return jsonify({"error": "Only the club creator can remove members."}), 403
    if target_user_id == user_id:
        return jsonify({"error": "You cannot remove yourself."}), 400
    membership = ClubMembership.query.filter_by(
        club_id=club_id, user_id=target_user_id
    ).first()
    if not membership:
        return jsonify({"error": "User is not a member."}), 404
    db.session.delete(membership)
    db.session.commit()
    return jsonify({"message": "Member removed."}), 200


# ── Club chat: get messages ───────────────────────────────────

@clubs_bp.route("/<int:club_id>/chat", methods=["GET"])
@jwt_required()
def get_chat(club_id):
    user_id = int(get_jwt_identity())
    club = Club.query.get_or_404(club_id)
    is_member = club.created_by == user_id or ClubMembership.query.filter_by(
        club_id=club_id, user_id=user_id, status="approved"
    ).first() is not None
    if not is_member:
        return jsonify({"error": "Members only."}), 403
    after_id = request.args.get("after", 0, type=int)
    msgs = (ClubMessage.query
            .filter(ClubMessage.club_id == club_id, ClubMessage.id > after_id)
            .order_by(ClubMessage.created_at.asc()).limit(100).all())
    return jsonify({"messages": [m.to_dict() for m in msgs]}), 200


# ── Club chat: send message ───────────────────────────────────

@clubs_bp.route("/<int:club_id>/chat", methods=["POST"])
@jwt_required()
def send_chat(club_id):
    user_id = int(get_jwt_identity())
    club = Club.query.get_or_404(club_id)
    is_member = club.created_by == user_id or ClubMembership.query.filter_by(
        club_id=club_id, user_id=user_id, status="approved"
    ).first() is not None
    if not is_member:
        return jsonify({"error": "Members only."}), 403
    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "Message cannot be empty."}), 400
    if len(content) > 1000:
        return jsonify({"error": "Message too long."}), 400

    # Optional reply threading
    reply_to_id = data.get("reply_to_id")
    reply_to_name = None
    reply_to_content = None
    if reply_to_id:
        parent = ClubMessage.query.get(int(reply_to_id))
        if parent and parent.club_id == club_id:
            reply_to_name = parent.author.name if parent.author else "Unknown"
            reply_to_content = parent.content[:150]

    msg = ClubMessage(
        club_id=club_id, user_id=user_id, content=content,
        reply_to_id=reply_to_id if reply_to_id else None,
        reply_to_name=reply_to_name,
        reply_to_content=reply_to_content,
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify({"message": msg.to_dict()}), 201


# ── Club events ──────────────────────────────────────────────
# Organisers (the club's creator, or an admin) post dated meetups. Anyone who
# can see the club sees its upcoming events and can add them to a calendar.
# Times are Korea time. Past events drop off the list and are deleted after
# EVENT_KEEP_DAYS by the nightly cleanup.

EVENT_KEEP_DAYS = 90


def _kst_now():
    from datetime import datetime, timedelta, timezone
    return datetime.now(timezone(timedelta(hours=9))).replace(tzinfo=None)


def _parse_local(raw):
    from datetime import datetime
    raw = (raw or "").strip()
    if not raw:
        return None
    try:
        return datetime.fromisoformat(raw[:16])
    except ValueError:
        return False


def _can_organise(club, user_id):
    if not user_id:
        return False
    if club.created_by == user_id:
        return True
    u = db.session.get(User, user_id)
    return bool(u and u.role == "admin")


@clubs_bp.route("/<int:club_id>/events", methods=["GET"])
def list_events(club_id):
    club = Club.query.filter_by(id=club_id, is_active=True).first_or_404()
    from datetime import timedelta
    since = _kst_now() - timedelta(hours=6)   # keep today's events visible while they run
    events = (ClubEvent.query.filter(ClubEvent.club_id == club.id, ClubEvent.starts_at >= since)
              .order_by(ClubEvent.starts_at.asc()).limit(50).all())
    return jsonify({"events": [e.to_dict() for e in events],
                    "can_organise": _can_organise(club, _current_user_id())}), 200


@clubs_bp.route("/<int:club_id>/events", methods=["POST"])
@jwt_required()
def create_event(club_id):
    user_id = int(get_jwt_identity())
    club = Club.query.filter_by(id=club_id, is_active=True).first_or_404()
    if not _can_organise(club, user_id):
        return jsonify({"error": "Only the club's organiser can add events."}), 403
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()[:150]
    starts_at = _parse_local(data.get("starts_at"))
    ends_at = _parse_local(data.get("ends_at"))
    if not title:
        return jsonify({"error": "Give the event a title."}), 400
    if not starts_at:
        return jsonify({"error": "Choose when the event starts."}), 400
    if ends_at is False or (ends_at and ends_at <= starts_at):
        return jsonify({"error": "The end time must be after the start time."}), 400
    if starts_at < _kst_now():
        return jsonify({"error": "The start time is in the past."}), 400
    location = (data.get("location") or "").strip()[:200]
    description = (data.get("description") or "").strip()[:2000]
    from routes.chat import _is_safe
    ok, _ = _is_safe(f"{title} {location} {description}")
    if not ok:
        return jsonify({"error": "This event breaks the community rules and wasn't saved."}), 400
    event = ClubEvent(club_id=club.id, title=title, starts_at=starts_at, ends_at=ends_at or None,
                      location=location, description=description, created_by=user_id)
    db.session.add(event)
    db.session.commit()
    return jsonify({"event": event.to_dict()}), 201


@clubs_bp.route("/events/<int:event_id>", methods=["DELETE"])
@jwt_required()
def delete_event(event_id):
    user_id = int(get_jwt_identity())
    event = ClubEvent.query.get_or_404(event_id)
    club = db.session.get(Club, event.club_id)
    if not club or not _can_organise(club, user_id):
        return jsonify({"error": "Only the club's organiser can delete events."}), 403
    db.session.delete(event)
    db.session.commit()
    return jsonify({"message": "Event deleted."}), 200


@clubs_bp.route("/events/upcoming", methods=["GET"])
@jwt_required()
def my_upcoming_events():
    """Next 30 days of events from clubs I belong to or run (for the dashboard)."""
    from datetime import timedelta
    user_id = int(get_jwt_identity())
    member_ids = {m.club_id for m in ClubMembership.query.filter_by(user_id=user_id, status="approved").all()}
    member_ids |= {c.id for c in Club.query.filter_by(created_by=user_id).all()}
    if not member_ids:
        return jsonify({"events": []}), 200
    now = _kst_now()
    rows = (db.session.query(ClubEvent, Club.name)
            .join(Club, Club.id == ClubEvent.club_id)
            .filter(ClubEvent.club_id.in_(member_ids), Club.is_active.is_(True),
                    ClubEvent.starts_at >= now - timedelta(hours=6),
                    ClubEvent.starts_at <= now + timedelta(days=30))
            .order_by(ClubEvent.starts_at.asc()).limit(10).all())
    return jsonify({"events": [{**e.to_dict(), "club_name": name} for e, name in rows]}), 200


def sweep_events() -> dict:
    """Nightly: delete events that ended more than EVENT_KEEP_DAYS ago. Commits."""
    from datetime import timedelta
    cutoff = _kst_now() - timedelta(days=EVENT_KEEP_DAYS)
    deleted = ClubEvent.query.filter(ClubEvent.starts_at < cutoff).delete(synchronize_session=False)
    db.session.commit()
    return {"events_deleted": deleted}

