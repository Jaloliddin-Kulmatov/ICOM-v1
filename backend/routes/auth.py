from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import os
import re
import requests as http_requests

from app import db, bcrypt
from models import (
    User, Club, ClubMembership, ClubMessage,
    Post, PostComment, AmbassadorApplication, Feedback, AISession, Job,
    ChatPost, ChatAnswer, ClubEvent, Device, UserActivity,
)
from routes.invites import apply_ref, record_activity

auth_bp = Blueprint("auth", __name__)

ABSTRACT_API_KEY = os.environ.get("ABSTRACT_EMAIL_API_KEY", "")


def _email_valid(email: str) -> bool:
    return bool(re.match(r"[^@]+@[^@]+\.[^@]+", email))


def _verify_email_deliverable(email: str) -> tuple[bool, str]:
    """Check email deliverability via Abstract API Email Reputation.
    Returns (is_valid, error_message). If API key not set, skips check."""
    if not ABSTRACT_API_KEY:
        return True, ""
    try:
        resp = http_requests.get(
            "https://emailreputation.abstractapi.com/v1/",
            params={"api_key": ABSTRACT_API_KEY, "email": email},
            timeout=5,
        )
        if resp.status_code != 200:
            return True, ""  # fail open — don't block on API errors
        data = resp.json()
        details = data.get("details", {})
        if details.get("disposable"):
            return False, "Disposable email addresses are not allowed. Please use a real email."
        if details.get("deliverable") is False:
            return False, "This email address doesn't appear to exist. Please use a real email."
        return True, ""
    except Exception:
        return True, ""  # fail open on network errors


@auth_bp.route("/check-email", methods=["GET"])
def check_email():
    email = (request.args.get("email") or "").strip().lower()
    if not email or not _email_valid(email):
        return jsonify({"exists": False, "valid": False, "message": "Invalid email format."}), 200

    exists = User.query.filter_by(email=email).first() is not None
    if exists:
        return jsonify({"exists": True, "valid": False, "message": "An account with this email already exists."}), 200

    is_valid, error_msg = _verify_email_deliverable(email)
    if not is_valid:
        return jsonify({"exists": False, "valid": False, "message": error_msg}), 200

    return jsonify({"exists": False, "valid": True, "message": ""}), 200


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
    apply_ref(user, data.get("ref"))
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

    # ── Check the token was issued to ICOM ────────────────────────────────────
    # userinfo alone accepts a token from ANY Google app, so another site that
    # got someone's token could sign in here as them. GOOGLE_CLIENT_ID may list
    # several IDs (website, iOS, Android), separated by commas.
    allowed = {c.strip() for c in os.getenv("GOOGLE_CLIENT_ID", "").split(",") if c.strip()}
    if not allowed:
        return jsonify({"error": "Google sign-in isn't set up yet. Use email and password."}), 503
    try:
        token_info = http_requests.get(
            "https://oauth2.googleapis.com/tokeninfo", params={"access_token": access_token}, timeout=10,
        )
    except Exception:
        return jsonify({"error": "Could not reach Google servers. Try again."}), 503
    issued_to = token_info.json() if token_info.status_code == 200 else {}
    if not ({issued_to.get("aud"), issued_to.get("azp")} & allowed):
        return jsonify({"error": "Invalid or expired Google token."}), 401

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
    created = False  # whether we created a new user in this call

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
        apply_ref(user, data.get("ref"))
        db.session.add(user)
        db.session.commit()
        created = True

    else:
        # Legacy / unspecified mode: keep find-or-create behaviour.
        if not user:
            user = User(
                name=name,
                email=email,
                password_hash="",
                is_verified=True,
            )
            apply_ref(user, data.get("ref"))
            db.session.add(user)
            db.session.commit()
            created = True

    # Touch last_seen if the column exists (returning users).
    if hasattr(user, "last_seen"):
        user.last_seen = datetime.utcnow()
        db.session.commit()

    # Tell the frontend whether the user's profile is still missing the
    # required onboarding info (university / visa_type / country) so it
    # can redirect to the onboarding page instead of straight to /dashboard.
    profile_complete = bool(
        (user.university or "").strip() and
        (user.country or "").strip() and
        (user.visa_type or "").strip()
    )

    jwt_token = create_access_token(
        identity=str(user.id),
        expires_delta=timedelta(days=30),
    )
    return jsonify({
        "message": f"Welcome, {user.name}!",
        "token": jwt_token,
        "user": user.to_dict(),
        "created": created,
        "profile_complete": profile_complete,
    }), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    record_activity(user)   # opening ICOM signed in counts as active today
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

    # Career profile (all optional; "" clears).
    for field, limit in (("job_field", 60), ("city", 60)):
        if data.get(field) is not None:
            setattr(user, field, str(data[field]).strip()[:limit] or None)
    if data.get("visa_expiry") is not None:
        raw = str(data["visa_expiry"]).strip()
        if raw:
            from datetime import date
            try:
                date.fromisoformat(raw)
            except ValueError:
                return jsonify({"error": "Visa expiry must be a date like 2027-03-31."}), 400
        if raw != (user.visa_expiry or ""):
            user.visa_reminder_sent = None   # new date → reminders start over
        user.visa_expiry = raw or None
    if "topik_level" in data:
        level = data["topik_level"]
        if level in (None, ""):
            user.topik_level = None
        else:
            try:
                level = int(level)
            except (TypeError, ValueError):
                level = -1
            if not 0 <= level <= 6:
                return jsonify({"error": "TOPIK level must be 0 (none) to 6."}), 400
            user.topik_level = level

    db.session.commit()
    return jsonify({"user": user.to_dict()}), 200


# Same ids as ARRIVAL_STEPS in src/lib/profile-options.ts.
CHECKLIST_STEPS = {"arc", "bank", "insurance", "phone", "tmoney", "housing", "work-permit"}


@auth_bp.route("/me/checklist", methods=["PUT"])
@jwt_required()
def save_checklist():
    """Arrival checklist: the ids of the steps this student has finished."""
    user = User.query.get_or_404(int(get_jwt_identity()))
    done = (request.get_json(silent=True) or {}).get("done") or []
    user.checklist = sorted({str(s) for s in done if str(s) in CHECKLIST_STEPS})
    db.session.commit()
    return jsonify({"checklist": user.checklist}), 200


# ── Delete account (permanent, cascade) ─────────────────────────────────────

@auth_bp.route("/me", methods=["DELETE"])
@jwt_required()
def delete_me():
    """Permanently delete the authenticated user and ALL their data.

    Requires the client to send {"confirm": "DELETE"} in the body OR
    as a query param (?confirm=DELETE) as a safety guard against
    accidental calls.
    """
    import traceback

    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Account not found. It may have already been deleted."}), 404

    # Accept the confirm token from either the JSON body or query string —
    # some HTTP clients drop the body on DELETE requests.
    data = request.get_json(silent=True) or {}
    confirm = data.get("confirm") or request.args.get("confirm")
    if confirm != "DELETE":
        return jsonify({
            "error": "Please send {\"confirm\": \"DELETE\"} to confirm account deletion."
        }), 400

    try:
        # 0) Chat Q&A, AI sessions, and other people's replies that point at
        #    this user's comments or club messages (Postgres enforces these
        #    links, so the deletes below would fail without this).
        user_chat_ids = [p.id for p in ChatPost.query.filter_by(user_id=user_id).all()]
        ChatAnswer.query.filter_by(user_id=user_id).delete(synchronize_session=False)
        if user_chat_ids:
            ChatAnswer.query.filter(ChatAnswer.post_id.in_(user_chat_ids)).delete(synchronize_session=False)
            ChatPost.query.filter(ChatPost.id.in_(user_chat_ids)).delete(synchronize_session=False)
        AISession.query.filter_by(user_id=user_id).delete(synchronize_session=False)
        ClubEvent.query.filter_by(created_by=user_id).update({ClubEvent.created_by: None}, synchronize_session=False)
        Device.query.filter_by(user_id=user_id).delete(synchronize_session=False)
        UserActivity.query.filter_by(user_id=user_id).delete(synchronize_session=False)
        own_comment_ids = [c.id for c in PostComment.query.filter_by(user_id=user_id).all()]
        if own_comment_ids:
            PostComment.query.filter(PostComment.parent_id.in_(own_comment_ids))\
                .update({PostComment.parent_id: None}, synchronize_session=False)
        own_msg_ids = [m.id for m in ClubMessage.query.filter_by(user_id=user_id).all()]
        if own_msg_ids:
            ClubMessage.query.filter(ClubMessage.reply_to_id.in_(own_msg_ids))\
                .update({ClubMessage.reply_to_id: None}, synchronize_session=False)

        # 1) Comments authored by the user (drop first to avoid FK issues).
        PostComment.query.filter_by(user_id=user_id).delete(synchronize_session=False)

        # 2) Posts authored by the user (and their comments).
        user_post_ids = [p.id for p in Post.query.filter_by(user_id=user_id).all()]
        if user_post_ids:
            PostComment.query.filter(PostComment.post_id.in_(user_post_ids))\
                .delete(synchronize_session=False)
            Post.query.filter(Post.id.in_(user_post_ids)).delete(synchronize_session=False)

        # 3) Chat messages and memberships.
        ClubMessage.query.filter_by(user_id=user_id).delete(synchronize_session=False)
        ClubMembership.query.filter_by(user_id=user_id).delete(synchronize_session=False)

        # 4) Clubs the user CREATED — cascade their messages, memberships,
        #    posts and comments tied to those clubs.
        owned_club_ids = [c.id for c in Club.query.filter_by(created_by=user_id).all()]
        if owned_club_ids:
            ClubMessage.query.filter(ClubMessage.club_id.in_(owned_club_ids))\
                .delete(synchronize_session=False)
            ClubMembership.query.filter(ClubMembership.club_id.in_(owned_club_ids))\
                .delete(synchronize_session=False)
            club_post_ids = [p.id for p in Post.query.filter(Post.club_id.in_(owned_club_ids)).all()]
            if club_post_ids:
                PostComment.query.filter(PostComment.post_id.in_(club_post_ids))\
                    .delete(synchronize_session=False)
                Post.query.filter(Post.id.in_(club_post_ids)).delete(synchronize_session=False)
            ClubEvent.query.filter(ClubEvent.club_id.in_(owned_club_ids)).delete(synchronize_session=False)
            Club.query.filter(Club.id.in_(owned_club_ids)).delete(synchronize_session=False)

        # 4b) CV, uploaded CV file, direct messages, blocks and reports.
        from models import Resume, ResumeFile, Conversation, DirectMessage, UserBlock, Report
        Resume.query.filter_by(user_id=user_id).delete(synchronize_session=False)
        ResumeFile.query.filter_by(user_id=user_id).delete(synchronize_session=False)
        conv_ids = [c.id for c in Conversation.query.filter(
            (Conversation.user_a_id == user_id) | (Conversation.user_b_id == user_id)).all()]
        if conv_ids:
            DirectMessage.query.filter(DirectMessage.conversation_id.in_(conv_ids))\
                .delete(synchronize_session=False)
            Conversation.query.filter(Conversation.id.in_(conv_ids)).delete(synchronize_session=False)
        UserBlock.query.filter((UserBlock.blocker_id == user_id) | (UserBlock.blocked_id == user_id))\
            .delete(synchronize_session=False)
        Report.query.filter_by(reporter_id=user_id).delete(synchronize_session=False)

        # 5) Jobs the user created — set created_by to NULL so postings survive
        #    (don't lose career data when the poster deletes their account).
        Job.query.filter_by(created_by=user_id).update(
            {"created_by": None}, synchronize_session=False
        )

        # 6) Feedback they submitted while signed in — anonymise instead of deleting
        #    so admins keep historical comments.
        Feedback.query.filter_by(user_id=user_id).update(
            {"user_id": None}, synchronize_session=False
        )

        # 7) Ambassador application (by email match).
        if user.email:
            AmbassadorApplication.query.filter_by(email=user.email).delete(
                synchronize_session=False
            )

        # 8) AI sessions.
        AISession.query.filter_by(user_id=user_id).delete(synchronize_session=False)

        # 9) Finally, the user.
        db.session.delete(user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        # Log full traceback to Render logs for debugging.
        print(f"[delete_me] failed for user_id={user_id}: {e}")
        traceback.print_exc()
        return jsonify({
            "error": "Could not delete your account due to a server error. "
                     "Please try again — if it keeps failing, contact support."
        }), 500

    return jsonify({"message": "Your account and all related data have been deleted."}), 200


# ── Password reset ────────────────────────────────────────────────────────────
# The email holds a signed link that is valid for an hour. The token carries the
# end of the current password hash, so it stops working once the password has
# changed (one use only). No table needed.

RESET_MAX_AGE = 3600
RESET_PER_EMAIL = 3          # requests per email per hour
RESET_PER_IP = 10            # requests per IP per hour
_reset_hits: dict = {}


def _reset_serializer():
    from flask import current_app
    from itsdangerous import URLSafeTimedSerializer
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"], salt="password-reset")


def make_reset_token(user) -> str:
    return _reset_serializer().dumps({"uid": user.id, "ph": user.password_hash[-16:]})


def read_reset_token(token: str):
    """The user the token belongs to, or None if it is bad, expired or already used."""
    from itsdangerous import BadSignature
    try:
        data = _reset_serializer().loads(token or "", max_age=RESET_MAX_AGE)
        user = db.session.get(User, int(data.get("uid", 0)))
    except (BadSignature, TypeError, ValueError, AttributeError):
        return None
    if not user or user.password_hash[-16:] != data.get("ph"):
        return None
    return user


def _reset_throttled(key: str, limit: int) -> bool:
    import time
    now = time.time()
    hits = [t for t in _reset_hits.get(key, []) if now - t < 3600]
    limited = len(hits) >= limit
    if not limited:
        hits.append(now)
    _reset_hits[key] = hits
    return limited


def _send_reset_email(to_email: str, name: str, link: str) -> None:
    import html as _html
    from routes.ambassador import _send_email
    first = _html.escape((name or "there").split(" ")[0])
    html = (
        '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#16213a">'
        '<h2 style="color:#00994a;margin-bottom:4px">ICOM</h2>'
        f"<p>Hi {first},</p>"
        "<p>Someone asked to reset the password for your ICOM account. If it was you, "
        "choose a new password with this button. The link works for one hour, one time.</p>"
        f'<p><a href="{_html.escape(link)}" style="display:inline-block;background:#00994a;color:#fff;'
        'padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">Choose a new password</a></p>'
        "<p style=\"color:#667\">If you didn't ask for this, ignore this email. Your password stays the same.</p>"
        "</div>"
    )
    text = (f"Hi {first},\n\nReset your ICOM password (link works for one hour, one time):\n{link}\n\n"
            "If you didn't ask for this, ignore this email.")
    _send_email(to_email, "Reset your ICOM password", html, text)


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    """Always answers the same way, so it never reveals whether an email has an account."""
    from flask import current_app
    from routes.ambassador import _email_configured

    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    if "@" not in email or len(email) > 254:
        return jsonify({"error": "Enter the email you signed up with."}), 400
    if not _email_configured():
        print("[auth] password reset asked but no email provider is configured (RESEND_API_KEY)")
        return jsonify({"error": "Password reset by email isn't available right now. "
                                 "Please contact us from the Contact page."}), 503

    sent_msg = {"message": "If an account uses that email, we've sent a link to reset the password. "
                           "Check your inbox and spam folder."}
    ip = (request.headers.get("X-Forwarded-For") or request.remote_addr or "").split(",")[0].strip()
    if _reset_throttled(f"ip:{ip}", RESET_PER_IP) or _reset_throttled(f"email:{email}", RESET_PER_EMAIL):
        return jsonify(sent_msg), 200

    user = User.query.filter_by(email=email).first()
    if user:
        from daily_emails import _site
        link = f"{_site()}/reset-password?token={make_reset_token(user)}"
        if current_app.testing:
            _send_reset_email(user.email, user.name, link)
        else:
            import threading
            threading.Thread(target=_send_reset_email, args=(user.email, user.name, link), daemon=True).start()
    return jsonify(sent_msg), 200


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json(silent=True) or {}
    password = data.get("password") or ""
    if len(password) < 6:
        return jsonify({"error": "Use at least 6 characters."}), 400
    user = read_reset_token(data.get("token") or "")
    if not user:
        return jsonify({"error": "This link has expired or was already used. Ask for a new one."}), 400
    user.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    db.session.commit()
    return jsonify({"message": "Password changed. You can sign in now."}), 200
