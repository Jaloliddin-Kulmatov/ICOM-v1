from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from sqlalchemy import or_, and_

from app import db
from models import Post, PostComment, Club, ClubMembership, AmbassadorApplication, User

posts_bp = Blueprint("posts", __name__)


def _current_user_id():
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        return int(identity) if identity else None
    except Exception:
        return None


def _is_ambassador(user: User) -> bool:
    app = AmbassadorApplication.query.filter_by(
        email=user.email, status="approved"
    ).first()
    return app is not None or user.role in ("ambassador", "admin")


def _get_post_as_options(user: User):
    """
    Returns posting options for News/Posts.
    Plain users cannot post — only ambassadors (as university) and club/community owners.
    Approved members CAN comment, but cannot create new news posts.
    """
    options = []

    # Ambassadors and admins can post as their university
    if _is_ambassador(user):
        if user.university:
            options.append({"type": "university", "label": user.university, "club_id": None})

    # Club/community creators can post as their club or community
    created = Club.query.filter_by(created_by=user.id, is_active=True).all()
    for c in created:
        ctype = (c.club_type or "club").lower()
        options.append({
            "type": "community" if ctype == "community" else "club",
            "label": c.name,
            "club_id": c.id,
        })

    return options


def _member_club_ids(user_id: int):
    """Return set of club IDs the user is creator or approved member of."""
    created = Club.query.filter_by(created_by=user_id, is_active=True).all()
    ids = {c.id for c in created}
    memberships = ClubMembership.query.filter_by(user_id=user_id, status="approved").all()
    ids.update(m.club_id for m in memberships)
    return ids


def _can_see_post(post: Post, user_id: int | None, club_ids: set) -> bool:
    """Return True if user is allowed to see this post."""
    if post.posted_as_type in ("user", "university"):
        return True  # public posts visible to all logged-in users
    if post.posted_as_type in ("club", "community") and post.club_id:
        return post.club_id in club_ids
    return True


# ── List posts (auth required; filtered by university + membership) ──

@posts_bp.route("", methods=["GET"])
def list_posts():
    user_id = _current_user_id()

    if not user_id:
        return jsonify({"posts": [], "locked": True}), 200

    user = User.query.get(user_id)
    club_ids = _member_club_ids(user_id)
    user_university = (user.university or "").strip().upper() if user else ""

    conditions = []

    # University posts — only from the user's own university
    if user_university:
        conditions.append(
            and_(
                Post.posted_as_type == "university",
                db.func.upper(Post.posted_as_label) == user_university
            )
        )

    # Club/community posts — only clubs/communities the user is a member of
    if club_ids:
        conditions.append(
            and_(Post.posted_as_type.in_(["club", "community"]), Post.club_id.in_(club_ids))
        )

    if not conditions:
        return jsonify({"posts": [], "locked": False}), 200

    posts = Post.query.filter(or_(*conditions)).order_by(Post.created_at.desc()).limit(50).all()

    return jsonify({"posts": [p.to_dict() for p in posts], "locked": False}), 200


# ── Get post-as options for current user ──────────────────────────

@posts_bp.route("/options", methods=["GET"])
@jwt_required()
def post_options():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    return jsonify({"options": _get_post_as_options(user)}), 200


# ── Create a post ─────────────────────────────────────────────────

@posts_bp.route("", methods=["POST"])
@jwt_required()
def create_post():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    data = request.get_json(silent=True) or {}

    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "Post content is required."}), 400
    if len(content) > 2000:
        return jsonify({"error": "Post too long (max 2000 chars)."}), 400

    posted_as_type = data.get("posted_as_type", "user")
    posted_as_label = data.get("posted_as_label") or user.name
    club_id = data.get("club_id")

    # Plain users cannot post news — only ambassadors (university) and club/community owners
    if posted_as_type == "user":
        return jsonify({"error": "Only ambassadors and club/community owners can post News."}), 403

    if posted_as_type == "university":
        if not _is_ambassador(user):
            return jsonify({"error": "Only ambassadors can post as a university."}), 403
    elif posted_as_type in ("club", "community") and club_id:
        club = Club.query.get(club_id)
        if not club:
            return jsonify({"error": "Club/community not found."}), 404
        if club.created_by != user_id:
            return jsonify({"error": "Only the owner can post News on behalf of this club/community."}), 403

    post = Post(
        user_id=user_id,
        content=content,
        posted_as_type=posted_as_type,
        posted_as_label=posted_as_label,
        club_id=club_id if posted_as_type in ("club", "community") else None,
    )
    db.session.add(post)
    db.session.commit()
    return jsonify({"post": post.to_dict()}), 201


# ── Delete a post (author only) ───────────────────────────────────

@posts_bp.route("/<int:post_id>", methods=["DELETE"])
@jwt_required()
def delete_post(post_id):
    user_id = int(get_jwt_identity())
    post = Post.query.get_or_404(post_id)
    if post.user_id != user_id:
        return jsonify({"error": "You can only delete your own posts."}), 403
    # Delete comments first
    PostComment.query.filter_by(post_id=post_id).delete()
    db.session.delete(post)
    db.session.commit()
    return jsonify({"message": "Post deleted."}), 200


# ── List comments on a post ───────────────────────────────────────

@posts_bp.route("/<int:post_id>/comments", methods=["GET"])
def list_comments(post_id):
    user_id = _current_user_id()
    if not user_id:
        return jsonify({"comments": [], "locked": True}), 200

    post = Post.query.get_or_404(post_id)
    club_ids = _member_club_ids(user_id)
    if not _can_see_post(post, user_id, club_ids):
        return jsonify({"error": "Access denied."}), 403

    comments = PostComment.query.filter_by(post_id=post_id).order_by(PostComment.created_at.asc()).all()
    return jsonify({"comments": [c.to_dict() for c in comments]}), 200


# ── Add a comment ─────────────────────────────────────────────────

@posts_bp.route("/<int:post_id>/comments", methods=["POST"])
@jwt_required()
def add_comment(post_id):
    user_id = int(get_jwt_identity())
    post = Post.query.get_or_404(post_id)
    club_ids = _member_club_ids(user_id)

    if not _can_see_post(post, user_id, club_ids):
        return jsonify({"error": "Access denied."}), 403

    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "Comment cannot be empty."}), 400
    if len(content) > 500:
        return jsonify({"error": "Comment too long (max 500 chars)."}), 400

    # Optional parent_id for threaded replies. Validate that the parent exists
    # on the same post (no cross-post replies).
    parent_id = data.get("parent_id")
    if parent_id is not None:
        parent = PostComment.query.get(parent_id)
        if not parent or parent.post_id != post_id:
            return jsonify({"error": "Invalid parent comment."}), 400
        # Flatten: if replying to a reply, attach to the top-level parent
        if parent.parent_id is not None:
            parent_id = parent.parent_id

    comment = PostComment(
        post_id=post_id, user_id=user_id, content=content, parent_id=parent_id
    )
    db.session.add(comment)
    db.session.commit()
    return jsonify({"comment": comment.to_dict()}), 201
