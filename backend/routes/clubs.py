from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request

from app import db
from models import Club, ClubMembership, User, ClubMessage

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


# ── List clubs ────────────────────────────────────────────────
# Rules:
#   club_type == "community"  → visible to every authenticated user
#   club_type == "club"       → visible only to users whose university
#                               matches the club's university field (flexible)
#   unauthenticated request   → communities only

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
        elif user_uni and _uni_matches(user_uni, c.university or ""):
            visible.append(c)                             # clubs: same university

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

    club_type_val = (data.get("club_type") or "club").strip()
    # Communities are nationwide — don't default their university to JBNU.
    # Clubs without a university supplied still default to JBNU.
    default_uni = "" if club_type_val == "community" else "JBNU"

    club = Club(
        name=name,
        description=(data.get("description") or "").strip(),
        category=(data.get("category") or "social").strip(),
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
            result.append({
                "membership_id": m.id,
                "user_id": u.id,
                "name": u.name,
                "university": u.university,
                "country": u.country,
                "visa_type": u.visa_type,
                "joined_at": m.joined_at.isoformat() + "Z",
            })

    # Also include creator in the list if not already there
    if is_creator:
        creator_ids = {r["user_id"] for r in result}
        if user_id not in creator_ids:
            u = User.query.get(user_id)
            if u:
                result.insert(0, {
                    "membership_id": None,
                    "user_id": u.id,
                    "name": u.name + " (Creator)",
                    "university": u.university,
                    "country": u.country,
                    "visa_type": u.visa_type,
                    "joined_at": club.created_at.isoformat() + "Z",
                })

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
                "location", "contact", "kakao_link", "website", "country"]
    for field in editable:
        if field in data:
            setattr(club, field, (data[field] or "").strip())

    db.session.commit()
    return jsonify({"club": club.to_dict(user_id=user_id)}), 200


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
