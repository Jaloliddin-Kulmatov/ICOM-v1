"""University news feed — JBNU notices (international / tuition / education),
scraped and translated to English. See scrapers/jbnu_notices.py."""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from models import Notice, User
import response_cache

NEWS_DAYS = 180   # older notices are hidden from the feed (and deleted after a year)


def _news_cutoff() -> str:
    from datetime import date, timedelta
    return (date.today() - timedelta(days=NEWS_DAYS)).isoformat()


def sweep_news() -> dict:
    """Nightly: hide notices older than NEWS_DAYS, delete ones older than a year. Commits."""
    from datetime import date, timedelta
    dated = (Notice.posted_date.isnot(None), Notice.posted_date != "")   # undated notices are kept
    hidden = (Notice.query.filter(Notice.is_active.is_(True), *dated, Notice.posted_date < _news_cutoff())
              .update({Notice.is_active: False}, synchronize_session=False))
    year_ago = (date.today() - timedelta(days=365)).isoformat()
    deleted = Notice.query.filter(*dated, Notice.posted_date < year_ago).delete(synchronize_session=False)
    db.session.commit()
    return {"news_hidden": hidden, "news_deleted": deleted}

news_bp = Blueprint("news", __name__)


@news_bp.route("", methods=["GET"])
def list_news():
    """Public list of active notices from the last NEWS_DAYS days, newest
    first. Optional ?category= filter (international | tuition | education | all)."""
    category = (request.args.get("category") or "").strip().lower()

    def build():
        from sqlalchemy import or_
        recent = or_(Notice.posted_date >= _news_cutoff(), Notice.posted_date.is_(None), Notice.posted_date == "")
        q = Notice.query.filter(Notice.is_active.is_(True), recent)
        if category and category != "all":
            q = q.filter_by(category=category)
        notices = q.order_by(Notice.posted_date.desc(), Notice.id.desc()).limit(60).all()
        return [n.to_dict() for n in notices]

    return jsonify({"notices": response_cache.cached(f"news:{category or 'all'}", 300, build)}), 200


@news_bp.route("/scrape", methods=["POST"])
@jwt_required()
def scrape_news():
    """Admin-only: trigger a JBNU notice scrape + translation now."""
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    if user.role != "admin":
        return jsonify({"error": "Admin access required."}), 403
    try:
        from scrapers.jbnu_notices import run_notice_scraper
        summary = run_notice_scraper(current_app._get_current_object())
        return jsonify({
            "message": (
                f"Scraped {summary['inserted']} new + {summary['updated']} updated notices."
            ),
            "summary": summary,
        }), 200
    except Exception as e:
        return jsonify({"error": f"Notice scrape failed: {e}"}), 500
