"""University news feed — JBNU notices (international / tuition / education),
scraped and translated to English. See scrapers/jbnu_notices.py."""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from models import Notice, User

news_bp = Blueprint("news", __name__)


@news_bp.route("", methods=["GET"])
def list_news():
    """Public list of active notices, newest first. Optional ?category= filter
    (international | tuition | education | all)."""
    category = (request.args.get("category") or "").strip().lower()
    q = Notice.query.filter_by(is_active=True)
    if category and category != "all":
        q = q.filter_by(category=category)
    notices = (
        q.order_by(Notice.posted_date.desc(), Notice.id.desc())
        .limit(60)
        .all()
    )
    return jsonify({"notices": [n.to_dict() for n in notices]}), 200


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
