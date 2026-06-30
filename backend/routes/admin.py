import sys, os
from collections import defaultdict
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from sqlalchemy import or_
from sqlalchemy.orm import joinedload

from app import db, bcrypt
from models import User, Club, Job, ClubMembership

admin_bp = Blueprint("admin", __name__)


def _require_admin():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    if user.role != "admin":
        return None, (jsonify({"error": "Admin access required."}), 403)
    return user, None


# ── Bootstrap: promote self to admin (uses ADMIN_SECRET env var) ─────────────
# POST /api/admin/bootstrap  { "secret": "..." }
# If secret matches ADMIN_SECRET env var, promotes the calling user to admin.
# Safe to leave enabled — wrong secret = 403.

@admin_bp.route("/bootstrap", methods=["POST"])
@jwt_required()
def bootstrap_admin():
    secret = os.environ.get("ADMIN_SECRET", "")
    if not secret:
        return jsonify({"error": "ADMIN_SECRET not configured on server."}), 503
    data = request.get_json(silent=True) or {}
    if data.get("secret") != secret:
        return jsonify({"error": "Wrong secret."}), 403
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    user.role = "admin"
    db.session.commit()
    return jsonify({"message": f"{user.name} is now admin.", "role": user.role}), 200


# ── Clubs ────────────────────────────────────────────────────────────────────

@admin_bp.route("/clubs", methods=["GET"])
def list_clubs():
    # Optionally include membership info if JWT present
    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if identity:
            user_id = int(identity)
    except Exception:
        pass
    # Eager-load creators and batch-fetch all memberships so to_dict() doesn't
    # fire ~4 queries per club (membership counts + creator lazy-load). With
    # ~190 clubs that N+1 was ~770 queries and blew past gunicorn's worker
    # timeout → 502, leaving the admin panel empty. One JOIN + one IN query now.
    clubs = (
        Club.query.options(joinedload(Club.creator))
        .filter_by(is_active=True)
        .order_by(Club.created_at.desc())
        .all()
    )
    ids = [c.id for c in clubs]
    memberships_by_club = defaultdict(list)
    if ids:
        for m in ClubMembership.query.filter(ClubMembership.club_id.in_(ids)).all():
            memberships_by_club[m.club_id].append(m)
    return jsonify({
        "clubs": [
            c.to_dict(user_id=user_id, _memberships=memberships_by_club[c.id])
            for c in clubs
        ]
    }), 200


@admin_bp.route("/clubs/<int:club_id>/join", methods=["POST"])
@jwt_required()
def join_club(club_id):
    user_id = int(get_jwt_identity())
    club = Club.query.get_or_404(club_id)
    if not club.is_active:
        return jsonify({"error": "Club not found."}), 404
    existing = ClubMembership.query.filter_by(user_id=user_id, club_id=club_id).first()
    if existing:
        return jsonify({"error": "Already a member."}), 409
    membership = ClubMembership(user_id=user_id, club_id=club_id)
    db.session.add(membership)
    db.session.commit()
    return jsonify({"message": "Joined!", "club": club.to_dict(user_id=user_id)}), 200


@admin_bp.route("/clubs/<int:club_id>/leave", methods=["POST"])
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


@admin_bp.route("/clubs/my", methods=["GET"])
@jwt_required()
def my_clubs():
    user_id = int(get_jwt_identity())
    memberships = ClubMembership.query.filter_by(user_id=user_id).all()
    clubs = [m.club for m in memberships if m.club.is_active]
    return jsonify({"clubs": [c.to_dict(user_id=user_id) for c in clubs]}), 200


@admin_bp.route("/clubs", methods=["POST"])
@jwt_required()
def create_club():
    user, err = _require_admin()
    if err:
        return err

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Club name is required."}), 400

    club = Club(
        name=name,
        description=(data.get("description") or "").strip(),
        category=(data.get("category") or "social").strip(),
        university=(data.get("university") or "JBNU").strip(),
        contact=(data.get("contact") or "").strip(),
        meeting_time=(data.get("meeting_time") or "").strip(),
        location=(data.get("location") or "").strip(),
        created_by=user.id,
    )
    db.session.add(club)
    db.session.commit()
    return jsonify({"club": club.to_dict()}), 201


@admin_bp.route("/clubs/<int:club_id>", methods=["PATCH"])
@jwt_required()
def edit_club(club_id):
    """Update any field of a club. Admin only."""
    user, err = _require_admin()
    if err:
        return err

    club = Club.query.get_or_404(club_id)
    data = request.get_json(silent=True) or {}

    if "name"         in data: club.name         = (data["name"]         or "").strip()
    if "description"  in data: club.description  = (data["description"]  or "").strip()
    if "category"     in data: club.category     = (data["category"]     or "").strip()
    if "university"   in data: club.university   = (data["university"]   or "").strip()
    if "meeting_time" in data: club.meeting_time = (data["meeting_time"] or "").strip()
    if "location"     in data: club.location     = (data["location"]     or "").strip()
    if "contact"      in data: club.contact      = (data["contact"]      or "").strip()
    if "kakao_link"   in data: club.kakao_link   = (data["kakao_link"]   or "").strip()
    if "website"      in data: club.website      = (data["website"]      or "").strip()
    if "club_type"    in data: club.club_type    = (data["club_type"]    or "club").strip()
    if "country"      in data: club.country      = (data["country"]      or "").strip()
    if "cover_image"  in data: club.cover_image  = (data["cover_image"]  or "").strip()

    db.session.commit()
    return jsonify({"club": club.to_dict(user_id=user.id)}), 200


@admin_bp.route("/clubs/<int:club_id>", methods=["DELETE"])
@jwt_required()
def delete_club(club_id):
    user, err = _require_admin()
    if err:
        return err

    club = Club.query.get_or_404(club_id)
    club.is_active = False
    db.session.commit()
    return jsonify({"message": "Club removed."}), 200


# ── Jobs ─────────────────────────────────────────────────────────────────────

SCRAPER_SECRET = os.environ.get("SCRAPER_SECRET", "")

# Last scrape result, shared across requests so the admin panel can poll for an
# accurate "added N new internships" count instead of guessing from job totals.
# Lives in-process (resets on restart) — that's fine, it's just a status board.
import threading as _threading
from datetime import datetime as _dt

_SCRAPE_LOCK = _threading.Lock()
_LAST_SCRAPE = {"state": "idle"}  # state: idle | running | done | error


def _set_scrape(**fields):
    with _SCRAPE_LOCK:
        _LAST_SCRAPE.clear()
        _LAST_SCRAPE.update(fields)


def _run_scraper_tracked(flask_app, kind="scrape", deactivated=0):
    """Run all enabled scrapers (Wanted + Saramin), recording combined status."""
    from scrapers.wanted import run_scraper as run_wanted
    _set_scrape(state="running", kind=kind, started_at=_dt.utcnow().isoformat() + "Z")
    try:
        # Wanted (always on — public API)
        summary = run_wanted(flask_app) or {}

        # Saramin (only runs if SARAMIN_API_KEY is configured; safe no-op otherwise)
        try:
            from scrapers.saramin import run_scraper as run_saramin
            s_summary = run_saramin(flask_app) or {}
            # Merge the two summaries so the admin sees the combined totals.
            for k, v in s_summary.items():
                if isinstance(v, int):
                    summary[k] = int(summary.get(k, 0)) + v
        except Exception as e:
            print(f"[saramin] scraper errored (continuing): {e}")

        added = int(summary.get("inserted", 0)) + int(summary.get("reactivated", 0))
        _set_scrape(
            state="done", kind=kind,
            finished_at=_dt.utcnow().isoformat() + "Z",
            added=added,
            deactivated=deactivated,
            summary=summary,
        )
    except Exception as e:
        print(f"[scrape] {kind} worker crashed: {e}")
        _set_scrape(state="error", kind=kind,
                    finished_at=_dt.utcnow().isoformat() + "Z", error=str(e))


@admin_bp.route("/jobs/scrape-status", methods=["GET"])
@jwt_required()
def scrape_status():
    """Poll the result of the most recent manual scrape/reset. Admin only."""
    user, err = _require_admin()
    if err:
        return err
    with _SCRAPE_LOCK:
        return jsonify(dict(_LAST_SCRAPE)), 200


@admin_bp.route("/jobs/scrape-now", methods=["POST"])
@jwt_required()
def scrape_now():
    """Manually trigger the Wanted.co.kr internship scraper. Admin only.
    Runs in a background thread so this request returns immediately."""
    user, err = _require_admin()
    if err:
        return err
    try:
        from flask import current_app
        import threading

        flask_app = current_app._get_current_object()
        threading.Thread(
            target=_run_scraper_tracked, args=(flask_app,),
            kwargs={"kind": "scrape"}, daemon=True, name="wanted-scrape-now",
        ).start()
        return jsonify({
            "message": "Scraper started. Poll /jobs/scrape-status for results.",
            "state": "running",
        }), 202
    except Exception as e:
        return jsonify({"error": f"Could not start scraper: {e}"}), 500


@admin_bp.route("/jobs/reset", methods=["POST"])
@jwt_required()
def reset_jobs():
    """Nuke-and-pave: deactivate every current job, then kick off a fresh
    scrape. The scraper's reactivation logic will revive any postings still
    live on Wanted with fully-translated English data + real deadlines.
    Korean-only rows that never get re-scraped stay inactive (hidden).
    Admin only. Returns 202 immediately; scrape runs in the background."""
    user, err = _require_admin()
    if err:
        return err
    try:
        from flask import current_app
        import threading

        # Count and deactivate everything that's currently visible. We don't
        # hard-delete because that would lose history (saved bookmarks, etc.)
        # — the scraper will flip is_active back to True for anything still
        # live on Wanted.
        active_jobs = Job.query.filter_by(is_active=True).all()
        deactivated = len(active_jobs)
        for j in active_jobs:
            j.is_active = False
        db.session.commit()

        flask_app = current_app._get_current_object()
        threading.Thread(
            target=_run_scraper_tracked, args=(flask_app,),
            kwargs={"kind": "reset", "deactivated": deactivated},
            daemon=True, name="wanted-reset",
        ).start()
        return jsonify({
            "message": (
                f"Deactivated {deactivated} job(s). Re-scrape started — fresh "
                "English data will replace them shortly."
            ),
            "deactivated": deactivated,
        }), 202
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Could not reset jobs: {e}"}), 500


@admin_bp.route("/jobs/fix-deadlines", methods=["POST"])
@jwt_required()
def fix_job_deadlines():
    """Clear the "today + 60 days" fake deadlines that the old scraper set
    when Wanted returned no real date. Detection: deadline == created_at
    date + 60 days. Those rows become rolling ("Apply anytime"); rows with
    a genuine date or a manually-edited one are left untouched. Admin only."""
    user, err = _require_admin()
    if err:
        return err
    from datetime import timedelta, date

    try:
        cleared = 0
        scanned = 0
        for job in Job.query.filter_by(is_active=True).all():
            scanned += 1
            raw = (job.deadline or "").strip()
            if len(raw) < 10:
                continue
            try:
                dl = date.fromisoformat(raw[:10])
            except ValueError:
                continue
            # Re-derive what the old default would have been: created_at + 60d.
            if not job.created_at:
                continue
            bogus = (job.created_at.date() + timedelta(days=60))
            # Allow a +/- 1 day tolerance for boundary cases caused by UTC
            # rollover between created_at and the original computation.
            if abs((dl - bogus).days) <= 1:
                job.deadline = ""
                cleared += 1
        if cleared:
            db.session.commit()
        return jsonify({
            "message": f"Cleared {cleared} fake deadlines (of {scanned} active jobs).",
            "cleared": cleared,
            "scanned": scanned,
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Could not fix deadlines: {e}"}), 500


@admin_bp.route("/jobs/translate-pending", methods=["POST"])
@jwt_required()
def translate_pending_jobs():
    """Backfill: translate any active job rows still in Korean (or missing
    the foreigner_friendly classification) via Groq. Admin only.

    Returns 200 with a summary so the frontend can display "Translated N of M".
    Runs synchronously so the response carries real numbers — caller should
    expect this to take 30-90 seconds for ~50 rows.
    """
    user, err = _require_admin()
    if err:
        return err
    try:
        from flask import current_app
        from scrapers.wanted import translate_pending
        flask_app = current_app._get_current_object()

        # First apply the committed offline translations (no network needed —
        # works even when Groq/Google are unavailable on the server).
        try:
            from app import _apply_baked_translations
            _apply_baked_translations(flask_app)
        except Exception as e:
            print(f"[admin] baked translation apply failed: {e}")

        # Allow caller to override the batch size; default high enough to sweep
        # the whole active board (we currently have ~140 listings).
        try:
            limit = int(request.args.get("limit", 200))
        except (TypeError, ValueError):
            limit = 200
        summary = translate_pending(flask_app, limit=limit)
        return jsonify({
            "message": (
                f"Translated {summary['translated']} of {summary['scanned']} job(s)."
            ),
            "summary": summary,
        }), 200
    except Exception as e:
        return jsonify({"error": f"Translate-pending failed: {e}"}), 500


@admin_bp.route("/jobs/bulk-ingest", methods=["POST"])
def bulk_ingest_jobs():
    """Scraper-only endpoint. Protected by SCRAPER_SECRET header, not JWT."""
    key = request.headers.get("X-Scraper-Key", "")
    if not SCRAPER_SECRET or key != SCRAPER_SECRET:
        return jsonify({"error": "Unauthorized"}), 401

    jobs_data = (request.get_json(silent=True) or {}).get("jobs", [])
    if not jobs_data:
        return jsonify({"inserted": 0, "skipped": 0}), 200

    # Fetch all existing apply_links in one query for deduplication
    existing_links = {
        row[0] for row in db.session.query(Job.apply_link).filter(Job.apply_link.isnot(None)).all()
    }

    inserted = 0
    skipped = 0
    for d in jobs_data:
        link = (d.get("apply_link") or "").strip()
        if not link or link in existing_links:
            skipped += 1
            continue
        title   = (d.get("title")   or "").strip()
        company = (d.get("company") or "").strip()
        if not title or not company:
            skipped += 1
            continue
        job = Job(
            title=title,
            company=company,
            location=(d.get("location") or "").strip(),
            job_type=(d.get("type") or "internship").strip(),
            salary=(d.get("salary") or "").strip(),
            description=(d.get("description") or "").strip(),
            requirements=(d.get("requirements") or "").strip(),
            visa_compatible=(d.get("visa_compatible") or "D-2, D-4").strip(),
            deadline=(d.get("deadline") or "").strip(),
            tags=(d.get("tags") or "").strip(),
            apply_link=link,
        )
        db.session.add(job)
        existing_links.add(link)
        inserted += 1

    db.session.commit()
    print(f"[scraper] inserted={inserted} skipped={skipped}")
    return jsonify({"inserted": inserted, "skipped": skipped}), 200


@admin_bp.route("/jobs", methods=["GET"])
def list_jobs():
    jobs = Job.query.filter_by(is_active=True).order_by(Job.created_at.desc()).all()
    return jsonify({"jobs": [j.to_dict() for j in jobs]}), 200


@admin_bp.route("/jobs", methods=["POST"])
@jwt_required()
def create_job():
    user, err = _require_admin()
    if err:
        return err

    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    company = (data.get("company") or "").strip()
    if not title or not company:
        return jsonify({"error": "Title and company are required."}), 400

    job = Job(
        title=title,
        company=company,
        location=(data.get("location") or "").strip(),
        job_type=(data.get("type") or "part-time").strip(),
        salary=(data.get("salary") or "").strip(),
        description=(data.get("description") or "").strip(),
        requirements=(data.get("requirements") or "").strip(),
        visa_compatible=(data.get("visa_compatible") or "D-2, D-4").strip(),
        deadline=(data.get("deadline") or "").strip(),
        tags=(data.get("tags") or "").strip(),
        apply_link=(data.get("apply_link") or "").strip(),
        created_by=user.id,
    )
    db.session.add(job)
    db.session.commit()
    return jsonify({"job": job.to_dict()}), 201


@admin_bp.route("/jobs/<int:job_id>", methods=["GET"])
def get_job(job_id):
    job = Job.query.filter_by(id=job_id, is_active=True).first_or_404()
    return jsonify({"job": job.to_dict()}), 200


@admin_bp.route("/jobs/<int:job_id>", methods=["PATCH"])
@jwt_required()
def edit_job(job_id):
    """Update any field of a job posting. Admin only."""
    user, err = _require_admin()
    if err:
        return err

    job = Job.query.get_or_404(job_id)
    data = request.get_json(silent=True) or {}

    if "title"          in data: job.title          = (data["title"]          or "").strip()
    if "company"        in data: job.company        = (data["company"]        or "").strip()
    if "location"       in data: job.location       = (data["location"]       or "").strip()
    if "type"           in data: job.job_type       = (data["type"]           or "").strip()
    if "salary"         in data: job.salary         = (data["salary"]         or "").strip()
    if "description"    in data: job.description    = (data["description"]    or "").strip()
    if "requirements"   in data: job.requirements   = (data["requirements"]   or "").strip()
    if "visa_compatible" in data: job.visa_compatible = (data["visa_compatible"] or "").strip()
    if "deadline"       in data: job.deadline       = (data["deadline"]       or "").strip()
    if "tags"           in data: job.tags           = (data["tags"]           or "").strip()
    if "apply_link"     in data: job.apply_link     = (data["apply_link"]     or "").strip()

    db.session.commit()
    return jsonify({"job": job.to_dict()}), 200


@admin_bp.route("/jobs/<int:job_id>", methods=["DELETE"])
@jwt_required()
def delete_job(job_id):
    user, err = _require_admin()
    if err:
        return err

    job = Job.query.get_or_404(job_id)
    job.is_active = False
    db.session.commit()
    return jsonify({"message": "Job removed."}), 200


# ── Apply-click counter (anonymous) ──────────────────────────────────────────
# Fire-and-forget POST from both the listings + detail Apply buttons. Anonymous
# by design, so we throttle per (IP, job) to stop a single client from looping
# the endpoint and inflating "Most Applied" social proof. The window is kept
# in-process (resets on restart) — good enough for a soft signal counter.

_APPLY_CLICK_WINDOW = 600  # seconds a repeat click from the same IP is ignored
_APPLY_CLICK_SEEN: dict = {}  # (ip, job_id) -> last counted unix ts
_APPLY_CLICK_LOCK = _threading.Lock()


def _apply_click_allowed(ip: str, job_id: int) -> bool:
    """True if this (ip, job) hasn't been counted within the throttle window.
    Also evicts stale entries so the dict can't grow without bound."""
    now = _dt.utcnow().timestamp()
    with _APPLY_CLICK_LOCK:
        # Evict expired entries opportunistically.
        if len(_APPLY_CLICK_SEEN) > 5000:
            for k, ts in list(_APPLY_CLICK_SEEN.items()):
                if now - ts > _APPLY_CLICK_WINDOW:
                    _APPLY_CLICK_SEEN.pop(k, None)
        key = (ip, job_id)
        last = _APPLY_CLICK_SEEN.get(key)
        if last is not None and (now - last) < _APPLY_CLICK_WINDOW:
            return False
        _APPLY_CLICK_SEEN[key] = now
        return True


@admin_bp.route("/jobs/<int:job_id>/apply-click", methods=["POST"])
def track_apply_click(job_id):
    job = Job.query.filter_by(id=job_id, is_active=True).first()
    if not job:
        return jsonify({"error": "Job not found."}), 404
    # X-Forwarded-For first hop (Render/most proxies prepend the real client IP).
    ip = (request.headers.get("X-Forwarded-For", "") or request.remote_addr or "").split(",")[0].strip()
    if not _apply_click_allowed(ip, job_id):
        # Silently acknowledge without counting — the client doesn't need to know.
        return jsonify({"apply_count": job.apply_count or 0}), 200
    job.apply_count = (job.apply_count or 0) + 1
    db.session.commit()
    return jsonify({"apply_count": job.apply_count}), 200


# ── Top hiring companies ─────────────────────────────────────────────────────
# Group active jobs by company name and return the top N. Used by the
# Internships sidebar to replace the hard-coded Kakao/Samsung/Naver list with
# real data from whatever's currently scraped.

@admin_bp.route("/jobs/top-companies", methods=["GET"])
def top_hiring_companies():
    try:
        limit = max(1, min(20, int(request.args.get("limit", 5))))
    except ValueError:
        limit = 5

    rows = (
        db.session.query(Job.company, db.func.count(Job.id).label("n"))
        .filter(Job.is_active == True, Job.company.isnot(None))  # noqa: E712
        .group_by(Job.company)
        .order_by(db.func.count(Job.id).desc())
        .limit(limit)
        .all()
    )
    companies = [{"name": (c or "").strip(), "jobs": int(n)} for c, n in rows if (c or "").strip()]
    return jsonify({"companies": companies}), 200


# ── Job alerts subscription ──────────────────────────────────────────────────
# Simple boolean flag on the user row. Daily-digest emails are out of scope
# for now — flipping this on is what the "Enable Alerts" button does, and we
# render a subscribed/unsubscribed state from it.

@admin_bp.route("/jobs/alerts", methods=["GET"])
@jwt_required()
def get_job_alerts():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    return jsonify({"enabled": bool(user.job_alerts_enabled)}), 200


@admin_bp.route("/jobs/alerts", methods=["POST"])
@jwt_required()
def toggle_job_alerts():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    data = request.get_json(silent=True) or {}
    # Accept explicit {"enabled": true/false}; default = toggle current value.
    if "enabled" in data:
        user.job_alerts_enabled = bool(data["enabled"])
    else:
        user.job_alerts_enabled = not bool(user.job_alerts_enabled)
    db.session.commit()
    return jsonify({"enabled": bool(user.job_alerts_enabled)}), 200


# ── Make user admin (dev helper) ─────────────────────────────────────────────

@admin_bp.route("/make-admin", methods=["POST"])
@jwt_required()
def make_admin():
    """Promote a user to admin by email. Only existing admins can do this."""
    user, err = _require_admin()
    if err:
        return err

    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    target = User.query.filter_by(email=email).first()
    if not target:
        return jsonify({"error": "User not found."}), 404

    target.role = "admin"
    db.session.commit()
    return jsonify({"message": f"{target.name} is now an admin."}), 200


# ── Seed international communities (production helper) ────────────────────────

@admin_bp.route("/seed-communities", methods=["POST"])
@jwt_required()
def seed_communities():
    """Seed all nationality-based international communities. Safe to run multiple times."""
    user, err = _require_admin()
    if err:
        return err

    try:
        seed_dir = os.path.join(os.path.dirname(__file__), "..")
        if seed_dir not in sys.path:
            sys.path.insert(0, seed_dir)
        from seed_clubs import SEED_CLUBS  # type: ignore

        system_user = User.query.filter_by(email="system@konect.kr").first()
        if not system_user:
            system_user = User(
                name="ICOM Team",
                email="system@konect.kr",
                password_hash=bcrypt.generate_password_hash("ICOM_SYSTEM_NO_LOGIN_9x!").decode(),
                university="JBNU",
                role="admin",
                is_verified=True,
            )
            db.session.add(system_user)
            db.session.commit()

        added = updated = 0
        for data in SEED_CLUBS:
            existing = Club.query.filter_by(name=data["name"]).first()
            if existing:
                existing.description  = data["description"]
                existing.contact      = data.get("contact", "")
                existing.kakao_link   = data.get("kakao_link", "")
                existing.meeting_time = data["meeting_time"]
                existing.location     = data["location"]
                existing.country      = data.get("country", "")
                existing.website      = data.get("website", existing.website or "")
                updated += 1
            else:
                club = Club(
                    name         = data["name"],
                    description  = data["description"],
                    category     = data["category"],
                    university   = data.get("university", "JBNU"),
                    meeting_time = data["meeting_time"],
                    location     = data["location"],
                    club_type    = data.get("club_type", "community"),
                    country      = data.get("country", ""),
                    contact      = data.get("contact", ""),
                    kakao_link   = data.get("kakao_link", ""),
                    website      = data.get("website", ""),
                    created_by   = system_user.id,
                    is_active    = True,
                )
                db.session.add(club)
                added += 1

        db.session.commit()
        return jsonify({
            "message": f"Done! Added {added} communities, updated {updated}.",
            "added": added,
            "updated": updated,
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ── Seed university clubs (production helper) ─────────────────────────────────

@admin_bp.route("/seed-university-clubs", methods=["POST"])
@jwt_required()
def seed_university_clubs():
    """Import UNIVERSITY_CLUBS from the seed script and insert/update records.
    Safe to call multiple times — existing clubs are updated, not duplicated."""
    user, err = _require_admin()
    if err:
        return err

    try:
        # Load seed data from the sibling seed file without spawning a new app
        seed_dir = os.path.join(os.path.dirname(__file__), "..")
        if seed_dir not in sys.path:
            sys.path.insert(0, seed_dir)
        from seed_university_clubs import UNIVERSITY_CLUBS  # type: ignore

        # Ensure the system bot user exists
        system_user = User.query.filter_by(email="system@konect.kr").first()
        if not system_user:
            system_user = User(
                name="ICOM Team",
                email="system@konect.kr",
                password_hash=bcrypt.generate_password_hash("ICOM_SYSTEM_NO_LOGIN_9x!").decode(),
                university="JBNU",
                role="admin",
                is_verified=True,
            )
            db.session.add(system_user)
            db.session.commit()

        added = updated = 0
        for data in UNIVERSITY_CLUBS:
            existing = Club.query.filter_by(name=data["name"]).first()
            if existing:
                existing.description  = data["description"]
                existing.contact      = data.get("contact", "")
                existing.kakao_link   = data.get("kakao_link", "")
                existing.meeting_time = data["meeting_time"]
                existing.location     = data["location"]
                existing.university   = data["university"]
                existing.club_type    = data.get("club_type", "club")
                existing.website      = data.get("website", existing.website or "")
                updated += 1
            else:
                club = Club(
                    name         = data["name"],
                    description  = data["description"],
                    category     = data["category"],
                    university   = data["university"],
                    meeting_time = data["meeting_time"],
                    location     = data["location"],
                    club_type    = data.get("club_type", "club"),
                    country      = data.get("country", ""),
                    contact      = data.get("contact", ""),
                    kakao_link   = data.get("kakao_link", ""),
                    website      = data.get("website", ""),
                    created_by   = system_user.id,
                    is_active    = True,
                )
                db.session.add(club)
                added += 1

        db.session.commit()
        return jsonify({
            "message": f"Seeded! Added {added} clubs, updated {updated}.",
            "added": added,
            "updated": updated,
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ── Transfer all ICOM-Team-owned clubs/communities to the requesting admin ────

@admin_bp.route("/transfer-clubs-to-me", methods=["POST"])
@jwt_required()
def transfer_clubs_to_me():
    """Transfer ownership of ALL clubs/communities and ALL internships to the requesting
    admin user. Clubs transfer from the ICOM system account; all active jobs transfer
    regardless of their current owner. Safe to call multiple times."""
    user, err = _require_admin()
    if err:
        return err

    # ── Clubs / communities ───────────────────────────────────────────────────
    system_user = User.query.filter_by(email="system@konect.kr").first()
    club_count = 0
    if system_user:
        clubs = Club.query.filter_by(created_by=system_user.id, is_active=True).all()
        club_count = len(clubs)
        for c in clubs:
            c.created_by = user.id

    # ── Internships / jobs ────────────────────────────────────────────────────
    # NOTE: `created_by != user.id` alone drops rows where created_by IS NULL
    # (SQL three-valued logic: NULL != x → NULL, not TRUE). Orphaned jobs — e.g.
    # ones whose poster deleted their account — have a NULL owner, so we must
    # explicitly include them or they'd never transfer.
    jobs = Job.query.filter(
        Job.is_active == True,  # noqa: E712
        or_(Job.created_by != user.id, Job.created_by.is_(None)),
    ).all()
    job_count = len(jobs)
    for j in jobs:
        j.created_by = user.id

    db.session.commit()

    return jsonify({
        "message": (
            f"Transferred {club_count} clubs/communities and "
            f"{job_count} internships to {user.name}."
        ),
        "clubs_transferred": club_count,
        "jobs_transferred": job_count,
    }), 200


# ── List all users ────────────────────────────────────────────────────────────

@admin_bp.route("/users", methods=["GET"])
@jwt_required()
def list_users():
    """Return all registered users. Admin only."""
    user, err = _require_admin()
    if err:
        return err

    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify({
        "total": len(users),
        "users": [u.to_dict() for u in users],
    }), 200


# ── Seed Jeonju/Jeonbuk real internship listings ──────────────────────────────

@admin_bp.route("/seed-jeonju-jobs", methods=["POST"])
@jwt_required()
def seed_jeonju_jobs():
    """Insert real Jeonju/Jeonbuk internship listings. Admin only. Safe to call
    multiple times — skips any listing whose apply_link already exists."""
    user, err = _require_admin()
    if err:
        return err

    import sys, os
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)

    from jeonju_jobs import JEONJU_JOBS

    # Dedup on the composite (link, title) key so a single apply_link can host
    # more than one role (e.g. LS Mtron lists two). The existing-row set must be
    # built with the SAME composite shape, otherwise the lookup below never
    # matches and every call re-inserts the whole list as duplicates.
    existing_links = {
        f"{(link or '').strip()}::{(title or '').strip()}"
        for link, title in db.session.query(Job.apply_link, Job.title)
        .filter(Job.apply_link.isnot(None))
        .all()
    }

    inserted = 0
    skipped = 0
    for d in JEONJU_JOBS:
        link = (d.get("apply_link") or "").strip()
        title = (d.get("title") or "").strip()
        company = (d.get("company") or "").strip()

        if not link or not title or not company:
            skipped += 1
            continue

        # Allow same apply_link for different titles (e.g. LS Mtron has two roles)
        dupe_key = f"{link}::{title}"
        if dupe_key in existing_links:
            skipped += 1
            continue

        job = Job(
            title=title,
            company=company,
            location=(d.get("location") or "").strip(),
            job_type=(d.get("type") or "internship").strip(),
            salary=(d.get("salary") or "").strip(),
            description=(d.get("description") or "").strip(),
            requirements=(d.get("requirements") or "").strip(),
            visa_compatible=(d.get("visa_compatible") or "D-2, D-4").strip(),
            deadline=(d.get("deadline") or "").strip(),
            tags=(d.get("tags") or "").strip(),
            apply_link=link,
            is_active=True,
            created_by=user.id,
        )
        db.session.add(job)
        existing_links.add(dupe_key)
        inserted += 1

    db.session.commit()
    return jsonify({
        "message": f"Seeded {inserted} Jeonju internships ({skipped} skipped as duplicates).",
        "inserted": inserted,
        "skipped": skipped,
    }), 200


# ── Seed ICOM Travel & ICOM Hiking communities ────────────────────────────────

@admin_bp.route("/seed-icom-clubs", methods=["POST"])
@jwt_required()
def seed_icom_clubs():
    """Create ICOM Travel and ICOM Hiking communities owned by the requesting
    admin. Safe to call multiple times — skips if name already exists."""
    user, err = _require_admin()
    if err:
        return err

    ICOM_CLUBS = [
        {
            "name": "ICOM Travel",
            "description": (
                "Your travel crew in Korea. We plan group trips around Korea and Asia — "
                "Busan beaches, Jeju island, Seoul weekends, Gyeongju history tours, and more. "
                "Share travel deals, visa-friendly destinations, budget tips, and find trip buddies "
                "going your direction. Whether you're exploring Korea for the first time or planning "
                "your next big trip, this is your group."
            ),
            "category": "social",
            "club_type": "community",
            "country": "South Korea",
            "meeting_time": "First Sunday of every month, 4:00 PM (trip planning meetup)",
            "location": "Jeonju Hanok Village Entrance / Online KakaoTalk",
            "contact": "@icom_travel (KakaoTalk open chat)",
            "cover_image": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
        },
        {
            "name": "ICOM Hiking",
            "description": (
                "Explore Korea's stunning mountains with fellow international students. "
                "From beginner-friendly trails around Jeonju to iconic peaks like Naejangsan, "
                "Deogyusan, and Jirisan — we hike together, every weekend. "
                "No experience needed, just good shoes and good energy. "
                "We share trail tips, pack lists, and always end with a post-hike meal together."
            ),
            "category": "sports",
            "club_type": "community",
            "country": "South Korea",
            "meeting_time": "Every Saturday, 7:00 AM (trail departure)",
            "location": "Jeonju City Hall Exit 2 (meetup point — changes by destination)",
            "contact": "@icom_hiking (KakaoTalk open chat)",
            "cover_image": "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80",
        },
    ]

    inserted = []
    skipped = []
    for d in ICOM_CLUBS:
        existing = Club.query.filter_by(name=d["name"], is_active=True).first()
        if existing:
            skipped.append(d["name"])
            continue
        club = Club(
            name=d["name"],
            description=d["description"],
            category=d["category"],
            club_type=d["club_type"],
            country=d["country"],
            meeting_time=d.get("meeting_time", ""),
            location=d.get("location", ""),
            contact=d.get("contact", ""),
            cover_image=d.get("cover_image", ""),
            university="",
            is_active=True,
            created_by=user.id,
        )
        db.session.add(club)
        db.session.flush()  # get club.id before commit
        # Auto-approve creator as a member
        membership = ClubMembership(club_id=club.id, user_id=user.id, status="approved")
        db.session.add(membership)
        inserted.append(d["name"])

    db.session.commit()
    return jsonify({
        "message": f"Created: {inserted}. Skipped (already exist): {skipped}.",
        "inserted": inserted,
        "skipped": skipped,
    }), 200


# ── Analytics — daily visitor counts ─────────────────────────────────────────

@admin_bp.route("/analytics", methods=["GET"])
@jwt_required()
def get_analytics():
    """Return daily page-visit counts for the last 30 days."""
    user, err = _require_admin()
    if err:
        return err

    from models import PageVisit
    from datetime import date, timedelta

    today = date.today()
    start = today - timedelta(days=29)

    rows = (
        PageVisit.query
        .filter(PageVisit.date >= start, PageVisit.date <= today)
        .order_by(PageVisit.date.asc())
        .all()
    )
    visit_map = {row.date: row.count for row in rows}

    # Fill zeros for days with no data
    result = []
    for i in range(30):
        d = start + timedelta(days=i)
        result.append({"date": d.isoformat(), "count": visit_map.get(d, 0)})

    total_today  = visit_map.get(today, 0)
    total_week   = sum(visit_map.get(today - timedelta(days=i), 0) for i in range(7))
    total_month  = sum(v for v in visit_map.values())

    return jsonify({
        "visits":      result,
        "today":       total_today,
        "this_week":   total_week,
        "this_month":  total_month,
    }), 200
