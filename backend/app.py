from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
import os

load_dotenv()

db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()


def create_app():
    app = Flask(__name__)

    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "jwt-secret-change-me")
    # Render gives postgres:// but SQLAlchemy needs postgresql://
    db_url = os.environ.get("DATABASE_URL", "sqlite:///icon.db")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False  # no expiry for dev; set timedelta in prod

    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")

    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = frontend_url
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response

    @app.before_request
    def handle_options():
        if request.method == "OPTIONS":
            from flask import make_response
            resp = make_response()
            resp.status_code = 200
            return resp

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)

    from routes.auth import auth_bp
    from routes.ai import ai_bp
    from routes.admin import admin_bp
    from routes.clubs import clubs_bp
    from routes.ambassador import ambassador_bp
    from routes.posts import posts_bp
    from routes.search import search_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(clubs_bp, url_prefix="/api/clubs")
    app.register_blueprint(ambassador_bp, url_prefix="/api/ambassador")
    app.register_blueprint(posts_bp, url_prefix="/api/posts")
    app.register_blueprint(search_bp, url_prefix="/api/search")

    @app.route("/")
    def index():
        return jsonify({"status": "ok", "service": "ICOM API", "version": "1.0", "frontend": "http://localhost:3000"})

    with app.app_context():
        db.create_all()
        _run_lightweight_migrations()
        _seed_communities()
        _seed_university_clubs()

    return app


def _run_lightweight_migrations():
    """Add columns that were introduced after the table was first created.
    Runs at startup — safe to call repeatedly (each migration checks first)."""
    from sqlalchemy import inspect, text
    insp = inspect(db.engine)

    # parent_id on post_comments (threaded replies)
    try:
        if "post_comments" in insp.get_table_names():
            cols = [c["name"] for c in insp.get_columns("post_comments")]
            if "parent_id" not in cols:
                with db.engine.begin() as conn:
                    conn.execute(text(
                        "ALTER TABLE post_comments "
                        "ADD COLUMN parent_id INTEGER REFERENCES post_comments(id)"
                    ))
                print("[migration] Added post_comments.parent_id")
    except Exception as e:
        print(f"[migration] post_comments.parent_id failed (probably already done): {e}")

    # social on ambassador_applications (added after initial table creation)
    try:
        if "ambassador_applications" in insp.get_table_names():
            cols = [c["name"] for c in insp.get_columns("ambassador_applications")]
            if "social" not in cols:
                with db.engine.begin() as conn:
                    conn.execute(text(
                        "ALTER TABLE ambassador_applications "
                        "ADD COLUMN social VARCHAR(300)"
                    ))
                print("[migration] Added ambassador_applications.social")
    except Exception as e:
        print(f"[migration] ambassador_applications.social failed (probably already done): {e}")

    # apply_link on jobs (added after initial table creation)
    try:
        if "jobs" in insp.get_table_names():
            cols = [c["name"] for c in insp.get_columns("jobs")]
            if "apply_link" not in cols:
                with db.engine.begin() as conn:
                    conn.execute(text(
                        "ALTER TABLE jobs "
                        "ADD COLUMN apply_link VARCHAR(500)"
                    ))
                print("[migration] Added jobs.apply_link")
    except Exception as e:
        print(f"[migration] jobs.apply_link failed (probably already done): {e}")

    # website on clubs (official university / community website)
    try:
        if "clubs" in insp.get_table_names():
            cols = [c["name"] for c in insp.get_columns("clubs")]
            if "website" not in cols:
                with db.engine.begin() as conn:
                    conn.execute(text(
                        "ALTER TABLE clubs "
                        "ADD COLUMN website VARCHAR(500)"
                    ))
                print("[migration] Added clubs.website")
    except Exception as e:
        print(f"[migration] clubs.website failed (probably already done): {e}")

    # reply threading columns on club_messages
    for col_name, col_def in [
        ("reply_to_id",      "INTEGER REFERENCES club_messages(id)"),
        ("reply_to_name",    "VARCHAR(150)"),
        ("reply_to_content", "VARCHAR(200)"),
    ]:
        try:
            if "club_messages" in insp.get_table_names():
                cols = [c["name"] for c in insp.get_columns("club_messages")]
                if col_name not in cols:
                    with db.engine.begin() as conn:
                        conn.execute(text(
                            f"ALTER TABLE club_messages ADD COLUMN {col_name} {col_def}"
                        ))
                    print(f"[migration] Added club_messages.{col_name}")
        except Exception as e:
            print(f"[migration] club_messages.{col_name} failed (probably already done): {e}")

def _seed_communities():
    """Seed real international communities (nationality-based) on first deploy.
    Checks by name — safe to call on every startup."""
    import sys, os
    from models import User, Club

    try:
        seed_dir = os.path.dirname(__file__)
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
                # Update website field if newly added to seed data
                if data.get("website") and not existing.website:
                    existing.website = data["website"]
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

        if added or updated:
            db.session.commit()
            print(f"[seed] Communities: added {added}, updated {updated} with website.")
        else:
            print("[seed] Communities already seeded — nothing to do.")

    except Exception as e:
        db.session.rollback()
        print(f"[seed] Communities seed skipped: {e}")


def _seed_university_clubs():
    """Seed real university-specific clubs on first deploy (and keep them updated).
    Checks by name — safe to call on every startup (only inserts missing clubs)."""
    import sys, os
    from models import User, Club

    try:
        seed_dir = os.path.dirname(__file__)
        if seed_dir not in sys.path:
            sys.path.insert(0, seed_dir)
        from seed_university_clubs import UNIVERSITY_CLUBS  # type: ignore

        # Ensure system bot user exists
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
                # Update website field if newly added to seed data
                if data.get("website") and not existing.website:
                    existing.website = data["website"]
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

        if added or updated:
            db.session.commit()
            print(f"[seed] University clubs: added {added}, updated {updated} with website.")
        else:
            print("[seed] University clubs already seeded — nothing to do.")

    except Exception as e:
        db.session.rollback()
        print(f"[seed] University clubs seed skipped: {e}")


app = create_app()
