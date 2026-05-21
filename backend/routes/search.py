from flask import Blueprint, request, jsonify
from sqlalchemy import or_, func

from models import Club, Job

search_bp = Blueprint("search", __name__)


@search_bp.route("", methods=["GET"])
def search():
    """
    GET /api/search?q=<query>&limit=<n>

    Returns matched clubs (communities + clubs), jobs/internships.
    No auth required — private fields (kakao_link, contact) are never returned here.
    """
    q = (request.args.get("q") or "").strip()
    limit = min(int(request.args.get("limit", 10)), 30)

    if not q or len(q) < 2:
        return jsonify({"results": []}), 200

    pattern = f"%{q}%"

    # ── Clubs & communities ───────────────────────────────────────
    clubs = (
        Club.query
        .filter(
            Club.is_active == True,
            or_(
                func.lower(Club.name).contains(q.lower()),
                func.lower(Club.description).contains(q.lower()),
                func.lower(Club.category).contains(q.lower()),
                func.lower(Club.university).contains(q.lower()),
                func.lower(Club.country).contains(q.lower()),
            )
        )
        .order_by(Club.created_at.desc())
        .limit(limit)
        .all()
    )

    # ── Jobs / internships ────────────────────────────────────────
    jobs = (
        Job.query
        .filter(
            Job.is_active == True,
            or_(
                func.lower(Job.title).contains(q.lower()),
                func.lower(Job.company).contains(q.lower()),
                func.lower(Job.description).contains(q.lower()),
                func.lower(Job.location).contains(q.lower()),
                func.lower(Job.tags).contains(q.lower()),
                func.lower(Job.visa_compatible).contains(q.lower()),
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
            "sub": c.description[:80] if c.description else (c.university or ""),
            "category": c.category,
            "university": c.university,
            "country": c.country,
            "href": "/community",
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
            "href": "/jobs",
        })

    return jsonify({"results": results, "query": q}), 200
