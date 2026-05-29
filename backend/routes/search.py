from flask import Blueprint, request, jsonify
from sqlalchemy import or_, func, text

from app import db
from models import Club, Job, ClubMembership

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

    # Correlated subquery: number of approved members per club. Used to order
    # results "most popular first". `Club.member_count` is NOT a real column
    # (it's only computed in Club.to_dict), so it cannot be used in order_by.
    member_count_sq = (
        db.session.query(func.count(ClubMembership.id))
        .filter(
            ClubMembership.club_id == Club.id,
            ClubMembership.status == "approved",
        )
        .correlate(Club)
        .scalar_subquery()
    )

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
            .order_by(member_count_sq.desc(), Club.created_at.desc())
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
            .order_by(member_count_sq.desc(), Club.created_at.desc())
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

    # Batch-fetch approved member counts for the matched clubs in one query
    # (avoids N+1 and the previous getattr() that always returned 0).
    club_ids = [c.id for c in clubs]
    approved_counts: dict[int, int] = {}
    if club_ids:
        rows = (
            db.session.query(ClubMembership.club_id, func.count(ClubMembership.id))
            .filter(
                ClubMembership.club_id.in_(club_ids),
                ClubMembership.status == "approved",
            )
            .group_by(ClubMembership.club_id)
            .all()
        )
        approved_counts = {cid: int(n) for cid, n in rows}

    for c in clubs:
        ctype = (c.club_type or "club").lower()
        # +1 for the creator (mirrors Club.to_dict's member_count default).
        member_count = approved_counts.get(c.id, 0) + 1
        results.append({
            "type": "community" if ctype == "community" else "club",
            "id": c.id,
            "label": c.name,
            "sub": (c.description[:80] if c.description else None) or c.university or "",
            "category": c.category,
            "university": c.university,
            "country": c.country,
            "member_count": member_count,
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
