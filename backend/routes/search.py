from flask import Blueprint, request, jsonify
from sqlalchemy import or_, func, text

from app import db
from models import Club, Job

search_bp = Blueprint("search", __name__)


@search_bp.route("", methods=["GET"])
def search():
    """
    GET /api/search?q=<query>&limit=<n>
    Returns matched clubs, communities, and jobs.
    No auth required — private fields never returned here.
    """
    q = (request.args.get("q") or "").strip()
    limit = min(int(request.args.get("limit", 10)), 30)

    if not q or len(q) < 2:
        return jsonify({"results": []}), 200

    q_lower = q.lower()

    # ── Clubs & communities ───────────────────────────────────────
    # Use ilike for PostgreSQL (index-friendly) and LIKE fallback for SQLite
    try:
        clubs = (
            Club.query
            .filter(
                Club.is_active == True,
                or_(
                    Club.name.ilike(f"%{q}%"),
                    Club.description.ilike(f"%{q}%"),
                    Club.category.ilike(f"%{q}%"),
                    Club.university.ilike(f"%{q}%"),
                    Club.country.ilike(f"%{q}%"),
                )
            )
            .order_by(Club.member_count.desc(), Club.created_at.desc())
            .limit(limit)
            .all()
        )
    except Exception:
        # SQLite fallback (no ilike support in older versions)
        clubs = (
            Club.query
            .filter(
                Club.is_active == True,
                or_(
                    func.lower(Club.name).contains(q_lower),
                    func.lower(Club.description).contains(q_lower),
                    func.lower(Club.category).contains(q_lower),
                    func.lower(Club.university).contains(q_lower),
                    func.lower(Club.country).contains(q_lower),
                )
            )
            .order_by(Club.member_count.desc(), Club.created_at.desc())
            .limit(limit)
            .all()
        )

    # ── Jobs / internships ────────────────────────────────────────
    try:
        jobs = (
            Job.query
            .filter(
                Job.is_active == True,
                or_(
                    Job.title.ilike(f"%{q}%"),
                    Job.company.ilike(f"%{q}%"),
                    Job.description.ilike(f"%{q}%"),
                    Job.location.ilike(f"%{q}%"),
                    Job.tags.ilike(f"%{q}%"),
                    Job.visa_compatible.ilike(f"%{q}%"),
                )
            )
            .order_by(Job.created_at.desc())
            .limit(limit)
            .all()
        )
    except Exception:
        jobs = (
            Job.query
            .filter(
                Job.is_active == True,
                or_(
                    func.lower(Job.title).contains(q_lower),
                    func.lower(Job.company).contains(q_lower),
                    func.lower(Job.description).contains(q_lower),
                    func.lower(Job.location).contains(q_lower),
                    func.lower(Job.tags).contains(q_lower),
                    func.lower(Job.visa_compatible).contains(q_lower),
                )
            )
            .order_by(Job.created_at.desc())
            .limit(limit)
            .all()
        )

    results = []

    for c in clubs:
        ctype = (c.club_type or "club").lower()
        results.append({
            "type": "community" if ctype == "community" else "club",
            "id": c.id,
            "label": c.name,
            "sub": (c.description[:80] if c.description else None) or c.university or "",
            "category": c.category,
            "university": c.university,
            "country": c.country,
            "member_count": getattr(c, "member_count", 0),
            "href": f"/community/{c.id}",   # direct link to club page
        })

    for j in jobs:
        results.append({
            "type": "job",
            "id": j.id,
            "label": j.title,
            "sub": f"{j.company} · {j.location or 'Korea'}",
            "company": j.company,
            "location": j.location,
            "job_type": j.job_type,
            "href": f"/jobs/{j.id}",          # direct link to job page
        })

    return jsonify({"results": results, "query": q}), 200
