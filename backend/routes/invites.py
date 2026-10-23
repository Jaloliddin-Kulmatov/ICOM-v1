"""Invite links and active-user counts.

Every student has a personal link, icom.ai.kr/?ref=<code>. The website keeps the
ref from the first visit and sends it when the person signs up, so we can see
which friends, ambassadors and chat groups bring new students. Admins can also
make campaign links with any tag (?ref=kakao-jbnu).

Active users: GET /auth/me (called whenever the website or app opens signed in)
records one row per user per day in user_activity.
"""
import random
import re
import string
from datetime import date, datetime, timedelta

from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import case, func

from app import db
from models import User, UserActivity

invites_bp = Blueprint("invites", __name__)

SITE = "https://icom.ai.kr"
_seen_today: set = set()   # (user_id, day) already written by this process


def clean_ref(raw) -> str:
    """Lowercase letters, digits, - and _ only, at most 40 characters."""
    return re.sub(r"[^a-z0-9_-]", "", str(raw or "").strip().lower())[:40]


def apply_ref(user: User, raw_ref) -> None:
    """Remember where a new user came from. Call before the sign-up commit."""
    ref = clean_ref(raw_ref)
    if not ref:
        return
    user.signup_ref = ref
    friend = User.query.filter_by(invite_code=ref).first()
    if friend and friend.id != user.id:
        user.referred_by_id = friend.id


def invite_code_for(user: User) -> str:
    """The user's code, made on first use from their first name (e.g. "aziz-k3f")."""
    if user.invite_code:
        return user.invite_code
    base = clean_ref((user.name or "").split(" ")[0]).replace("_", "")[:12] or "icom"
    for _ in range(20):
        code = f"{base}-{''.join(random.choices(string.ascii_lowercase + string.digits, k=3))}"
        if not User.query.filter_by(invite_code=code).first():
            user.invite_code = code
            db.session.commit()
            return code
    raise RuntimeError("could not make a unique invite code")


def record_activity(user: User) -> None:
    """Mark the user active today (at most one write per user per day per process)."""
    today = date.today()
    if (user.id, today) in _seen_today:
        return
    try:
        if not UserActivity.query.filter_by(user_id=user.id, day=today).first():
            db.session.add(UserActivity(user_id=user.id, day=today))
        user.last_seen = datetime.utcnow()
        db.session.commit()
        _seen_today.add((user.id, today))
        if len(_seen_today) > 50_000:
            _seen_today.clear()
    except Exception:
        db.session.rollback()   # another worker wrote it first; never break /auth/me


@invites_bp.route("/me", methods=["GET"])
@jwt_required()
def my_invite():
    user = User.query.get_or_404(int(get_jwt_identity()))
    code = invite_code_for(user)
    joined = User.query.filter_by(referred_by_id=user.id).count()
    return jsonify({"code": code, "link": f"{SITE}/?ref={code}", "joined": joined}), 200


def growth_stats() -> dict:
    """Active users and sign-ups by ref, for the admin panel."""
    today = date.today()

    def active_since(days: int) -> int:
        return db.session.query(func.count(func.distinct(UserActivity.user_id))) \
            .filter(UserActivity.day > today - timedelta(days=days)).scalar() or 0

    weeks = []
    for i in range(7, -1, -1):
        end = today - timedelta(days=7 * i)
        start = end - timedelta(days=6)
        n = db.session.query(func.count(func.distinct(UserActivity.user_id))) \
            .filter(UserActivity.day >= start, UserActivity.day <= end).scalar() or 0
        weeks.append({"week_ending": end.isoformat(), "active": n})

    week_ago = datetime.utcnow() - timedelta(days=7)
    by_ref = db.session.query(
        User.signup_ref, func.count(User.id),
        func.sum(case((User.created_at >= week_ago, 1), else_=0)),
    ).filter(User.signup_ref.isnot(None), User.signup_ref != "") \
        .group_by(User.signup_ref).order_by(func.count(User.id).desc()).limit(50).all()

    inviters = db.session.query(User.referred_by_id, func.count(User.id)) \
        .filter(User.referred_by_id.isnot(None)).group_by(User.referred_by_id) \
        .order_by(func.count(User.id).desc()).limit(20).all()
    names = {u.id: u for u in User.query.filter(User.id.in_([i for i, _ in inviters])).all()} if inviters else {}

    return {
        "dau": active_since(1), "wau": active_since(7), "mau": active_since(30),
        "total_users": User.query.count(),
        "new_this_week": User.query.filter(User.created_at >= week_ago).count(),
        "weekly_active": weeks,
        "signups_by_ref": [{"ref": r, "total": t, "last_7_days": int(w or 0)} for r, t, w in by_ref],
        "top_inviters": [
            {"name": names[i].name, "university": names[i].university or "", "code": names[i].invite_code or "", "joined": n}
            for i, n in inviters if i in names
        ],
    }
