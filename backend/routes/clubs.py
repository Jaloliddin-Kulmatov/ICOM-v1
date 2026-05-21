from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request

from app import db
from models import Club, ClubMembership, User, ClubMessage

clubs_bp = Blueprint("clubs", __name__)


def _current_user_id():
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        return int(identity) if identity else None
    except Exception:
        return None


# ── List clubs ────────────────────────────────────────────────
# Rules:
#   club_type == "community"  → visible to every authenticated user
#   club_type == "club"       → visible only to users whose university
#                               matches the club's university field
#   unauthenticated request   → communities only (no private clubs shown)

@clubs_bp.route("", methods=["GET"])
def list_clubs():
    user_id = _current_user_id()

    user_uni = None
    if user_id:
        u = User.query.get(user_id)
        if u:
            user_uni = (u.university or "").strip()

    all_clubs = (
        Club.query.filter_by(is_active=True)
        .order_by(Club.created_at.desc())
        .all()
    )

    visible = []
    for c in all_clubs:
        ctype = (c.club_type or "club").lower()
        if ctype == "community":
            visible.append(c)                             # communities: everyone
        elif user_uni and (c.university or "").strip() == user_uni:
            visible.append(c)                             # clubs: same university only

    return jsonify({"clubs": [c.to_dict(user_id=user_id) for c in visible]}), 200


# ── Create a club (any authenticated user) ───────────────────

@clubs_bp.route("", methods=["POST"])
@jwt_required()
def create_club():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Club name is required."}), 400

    club = Club(
        name=name,
        description=(data.get("description") or "").strip(),
        category=(data.get("category") or "social").strip(),
        university=(data.get("university") or "JBNU").strip(),
        kakao_link=(data.get("kakao_link") or "").strip(),
        contact=(data.get("contact") or "").strip(),
        meeting_time=(data.get("meeting_time") or "").strip(),
        location=(data.get("location") or "").strip(),
        club_type=(data.get("club_type") or "club").strip(),
        country=(data.get("country") or "").strip(),
        created_by=user_id,
    )
    db.session.add(club)
    db.session.commit()
    return jsonify({"club": club.to_dict(user_id=user_id)}), 201


# ── Request to join ───────────────────────────────────────────

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
        return jsonify({"error": "Already requested or a member.", "status": existing.status}), 409

    membership = ClubMembership(user_id=user_id, club_id=club_id, status="pending")
    db.session.add(membership)
    db.session.commit()
    return jsonify({"message": "Join request sent!", "club": club.to_dict(user_id=user_id)}), 200


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


# ── Get approved members (creator only) ──────────────────────

@clubs_bp.route("/<int:club_id>/members", methods=["GET"])
@jwt_required()
def get_members(club_id):
    user_id = int(get_jwt_identity())
    club = Club.query.get_or_404(club_id)
    if club.created_by != user_id:
        return jsonify({"error": "Only the club creator can view members."}), 403

    approved = ClubMembership.query.filter_by(club_id=club_id, status="approved").all()
    result = []
    for m in approved:
        u = User.query.get(m.user_id)
        if u:
            result.append({
                "membership_id": m.id,
                "user_id": u.id,
                "name": u.name,
                "university": u.university,
                "country": u.country,
                "visa_type": u.visa_type,
                "joined_at": m.joined_at.isoformat() + "Z",
            })
    return jsonify({"members": result}), 200


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
    msg = ClubMessage(club_id=club_id, user_id=user_id, content=content)
    db.session.add(msg)
    db.session.commit()
    return jsonify({"message": msg.to_dict()}), 201
