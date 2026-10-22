from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
from datetime import timedelta
import os

load_dotenv()

db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()


def create_app():
    app = Flask(__name__)

    # In production, refuse to boot with the public fallback secrets: anyone
    # could forge login tokens with them.
    if os.environ.get("FLASK_ENV") == "production":
        missing = [k for k in ("SECRET_KEY", "JWT_SECRET_KEY") if not os.environ.get(k)]
        if missing:
            raise RuntimeError(f"Missing required env vars in production: {', '.join(missing)}")
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "jwt-secret-change-me")
    db_url = os.environ.get("DATABASE_URL", "sqlite:///icon.db")
    # Always use psycopg2 (what requirements.txt installs). Render/Heroku give
    # postgres://, some providers' SQLAlchemy snippets give postgresql+psycopg://, and
    # SQLAlchemy 2.1+ maps a bare postgresql:// to psycopg 3 by default.
    for prefix in ("postgres://", "postgresql://", "postgresql+psycopg://"):
        if db_url.startswith(prefix):
            db_url = "postgresql+psycopg2://" + db_url[len(prefix):]
            break
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {"pool_pre_ping": True}
    if db_url.startswith("postgresql"):
        app.config["SQLALCHEMY_POOL_SIZE"] = 5
        app.config["SQLALCHEMY_MAX_OVERFLOW"] = 10
        app.config["SQLALCHEMY_POOL_RECYCLE"] = 300
        app.config["SQLALCHEMY_POOL_TIMEOUT"] = 20
    # Tokens expire after 30 days for every auth path (email/password AND Google),
    # so a leaked token can't grant access forever. Override per-token with
    # expires_delta if a specific flow needs a different lifetime.
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=30)

    # Multi-origin CORS. FRONTEND_URL may be a comma-separated list; we also
    # auto-allow our own production domain, its www/subdomains, and Vercel /
    # Render preview deploys, plus localhost for dev. We echo back the caller's
    # origin when it's allowed (required because Allow-Credentials is true, so
    # a wildcard "*" is not permitted).
    raw_frontend = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    allowed_origins = {o.strip() for o in raw_frontend.split(",") if o.strip()}
    _fallback_origin = next(iter(allowed_origins), "http://localhost:3000")

    def _origin_allowed(origin: str) -> bool:
        if not origin:
            return False
        if origin in allowed_origins:
            return True
        try:
            from urllib.parse import urlparse
            host = (urlparse(origin).hostname or "").lower()
        except Exception:
            return False
        return (
            host in ("localhost", "127.0.0.1")
            or host == "icom.ai.kr"
            or host.endswith(".icom.ai.kr")
            or host.endswith(".vercel.app")
            or host.endswith(".onrender.com")
        )

    @app.after_request
    def add_cors_headers(response):
        origin = request.headers.get("Origin", "")
        response.headers["Access-Control-Allow-Origin"] = (
            origin if _origin_allowed(origin) else _fallback_origin
        )
        response.headers["Vary"] = "Origin"
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
    import response_cache
    response_cache.install(db)
    jwt.init_app(app)
    bcrypt.init_app(app)

    from routes.auth import auth_bp
    from routes.ai import ai_bp
    from routes.admin import admin_bp
    from routes.clubs import clubs_bp
    from routes.ambassador import ambassador_bp
    from routes.posts import posts_bp
    from routes.search import search_bp
    from routes.feedback import feedback_bp
    from routes.chat import chat_bp
    from routes.track import track_bp
    from routes.news import news_bp
    from routes.cv import cv_bp
    from routes.messages import messages_bp, users_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(clubs_bp, url_prefix="/api/clubs")
    app.register_blueprint(ambassador_bp, url_prefix="/api/ambassador")
    app.register_blueprint(posts_bp, url_prefix="/api/posts")
    app.register_blueprint(search_bp, url_prefix="/api/search")
    app.register_blueprint(feedback_bp, url_prefix="/api/feedback")
    app.register_blueprint(chat_bp, url_prefix="/api/chat")
    app.register_blueprint(track_bp, url_prefix="/api/track")
    app.register_blueprint(news_bp, url_prefix="/api/news")
    app.register_blueprint(cv_bp, url_prefix="/api/cv")
    app.register_blueprint(messages_bp, url_prefix="/api/messages")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    from routes.devices import devices_bp, app_config_bp
    app.register_blueprint(devices_bp, url_prefix="/api/devices")
    app.register_blueprint(app_config_bp, url_prefix="/api/app")
    # Uploaded CVs are capped at 2 MB in routes/cv.py; reject anything far bigger early.
    app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024

    @app.route("/")
    def index():
        return jsonify({"status": "ok", "service": "ICOM API", "version": "1.0", "frontend": _fallback_origin})

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok"}), 200

    @app.route("/api/health/db")
    def health_db():
        """How long one database round trip takes from this server, in ms.
        Under ~10 ms means the server and database are in the same region."""
        import time
        from sqlalchemy import text
        times = []
        for _ in range(3):
            t = time.perf_counter()
            db.session.execute(text("SELECT 1"))
            times.append(round((time.perf_counter() - t) * 1000, 1))
        return jsonify({"db_round_trip_ms": min(times), "samples_ms": times}), 200

    with app.app_context():
        db.create_all()
        _run_lightweight_migrations()
        if _startup_tasks_enabled():
            _seed_all()

    # NOTE: the background scheduler is started once at module load via
    # _start_scheduler(app) at the bottom of this file (the canonical
    # definition that schedules both the Wanted scraper and the daily
    # expired-job cleanup). It is intentionally NOT started here to avoid
    # spinning up a second, duplicate scheduler on every boot.

    return app


def _startup_tasks_enabled() -> bool:
    """Seeding and translation used to run on every boot, which made cold
    starts on free hosting slow enough to time out. In production set
    STARTUP_TASKS=0 and run `python bootstrap.py` once (Render does it in the
    build step). Local development keeps the old behaviour by default."""
    return os.environ.get("STARTUP_TASKS", "1") != "0"


def _seed_all():
    """Idempotent seeds: safe to run on every deploy."""
    _seed_communities()
    _seed_university_clubs()
    _seed_chat_threads()
    _seed_jeonju_jobs()


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

    # checked_at / closed_at on jobs (job expiry + deletion). Existing open
    # jobs count as checked now, so they get a full STALE_DAYS window for the
    # daily verification to confirm them; existing closed ones start their
    # 30-day countdown to deletion now.
    try:
        if "jobs" in insp.get_table_names():
            cols = [c["name"] for c in insp.get_columns("jobs")]
            for col in ("checked_at", "closed_at"):
                if col not in cols:
                    with db.engine.begin() as conn:
                        conn.execute(text(f"ALTER TABLE jobs ADD COLUMN {col} TIMESTAMP"))
                        if col == "checked_at":
                            conn.execute(text("UPDATE jobs SET checked_at = CURRENT_TIMESTAMP WHERE is_active"))
                        else:
                            conn.execute(text("UPDATE jobs SET closed_at = CURRENT_TIMESTAMP WHERE NOT is_active"))
                    print(f"[migration] Added jobs.{col}")
    except Exception as e:
        print(f"[migration] jobs.checked_at/closed_at failed (probably already done): {e}")

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

    # foreigner_friendly + foreigner_note on jobs (AI-detected from Korean
    # job posts during scraping). apply_count tracks how many users clicked
    # the Apply button — shown as "N applied" on cards.
    for col_name, col_def in [
        ("foreigner_friendly", "VARCHAR(20) DEFAULT ''"),
        ("foreigner_note",     "VARCHAR(300) DEFAULT ''"),
        ("apply_count",        "INTEGER DEFAULT 0"),
        ("review_status",      "VARCHAR(20) DEFAULT 'approved'"),
    ]:
        try:
            if "jobs" in insp.get_table_names():
                cols = [c["name"] for c in insp.get_columns("jobs")]
                if col_name not in cols:
                    with db.engine.begin() as conn:
                        conn.execute(text(f"ALTER TABLE jobs ADD COLUMN {col_name} {col_def}"))
                    print(f"[migration] Added jobs.{col_name}")
        except Exception as e:
            print(f"[migration] jobs.{col_name} failed (probably already done): {e}")

    # job_alerts_enabled on users — opt-in for new-internship digests.
    try:
        if "users" in insp.get_table_names():
            cols = [c["name"] for c in insp.get_columns("users")]
            if "job_alerts_enabled" not in cols:
                with db.engine.begin() as conn:
                    conn.execute(text(
                        "ALTER TABLE users ADD COLUMN job_alerts_enabled BOOLEAN DEFAULT FALSE"
                    ))
                print("[migration] Added users.job_alerts_enabled")
    except Exception as e:
        print(f"[migration] users.job_alerts_enabled failed (probably already done): {e}")

    # Career profile, saved alert search, reminders and checklist on users;
    # accepted answers in chat.
    for table, col, ddl in (
        ("users", "visa_expiry", "VARCHAR(10)"),
        ("users", "topik_level", "INTEGER"),
        ("users", "job_field", "VARCHAR(60)"),
        ("users", "city", "VARCHAR(60)"),
        ("users", "alert_field", "VARCHAR(60)"),
        ("users", "alert_city", "VARCHAR(60)"),
        ("users", "alert_last_sent", "TIMESTAMP"),
        ("users", "visa_reminder_sent", "VARCHAR(20)"),
        ("users", "checklist", "JSON"),
        ("chat_answers", "is_accepted", "BOOLEAN DEFAULT FALSE"),
    ):
        try:
            if table in insp.get_table_names() and col not in [c["name"] for c in insp.get_columns(table)]:
                with db.engine.begin() as conn:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {ddl}"))
                print(f"[migration] Added {table}.{col}")
        except Exception as e:
            print(f"[migration] {table}.{col} failed (probably already done): {e}")

    # scope on chat_posts — audience targeting. Empty = global ("All Korea"),
    # a university token (e.g. "jbnu") = that university's chat only.
    try:
        if "chat_posts" in insp.get_table_names():
            cols = [c["name"] for c in insp.get_columns("chat_posts")]
            if "scope" not in cols:
                with db.engine.begin() as conn:
                    conn.execute(text(
                        "ALTER TABLE chat_posts ADD COLUMN scope VARCHAR(80) DEFAULT ''"
                    ))
                print("[migration] Added chat_posts.scope")
    except Exception as e:
        print(f"[migration] chat_posts.scope failed (probably already done): {e}")

    # cover_image on clubs (optional user-set cover photo URL)
    try:
        if "clubs" in insp.get_table_names():
            cols = [c["name"] for c in insp.get_columns("clubs")]
            if "cover_image" not in cols:
                with db.engine.begin() as conn:
                    conn.execute(text("ALTER TABLE clubs ADD COLUMN cover_image VARCHAR(500)"))
                print("[migration] Added clubs.cover_image")
    except Exception as e:
        print(f"[migration] clubs.cover_image failed (probably already done): {e}")

    # page_visits table — daily visit counter (created by db.create_all if absent)
    # Just ensure it exists; SQLAlchemy creates it via the PageVisit model above.
    try:
        from models import PageVisit  # noqa: F401 — import ensures table is registered
    except Exception:
        pass

    # ── Search indexes for fast LIKE/ILIKE queries ───────────────────────────
    # PostgreSQL only — silently skipped on SQLite
    try:
        dialect = db.engine.dialect.name
        if dialect == "postgresql":
            with db.engine.begin() as conn:
                conn.execute(text(
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clubs_name_trgm "
                    "ON clubs USING gin (lower(name) gin_trgm_ops)"
                ))
                conn.execute(text(
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_title_trgm "
                    "ON jobs USING gin (lower(title) gin_trgm_ops)"
                ))
                conn.execute(text(
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_company_trgm "
                    "ON jobs USING gin (lower(company) gin_trgm_ops)"
                ))
            print("[migration] Search trigram indexes created/verified")
    except Exception as e:
        # pg_trgm extension may not be enabled — fall back to regular B-tree indexes
        try:
            dialect = db.engine.dialect.name
            if dialect == "postgresql":
                with db.engine.begin() as conn:
                    conn.execute(text(
                        "CREATE INDEX IF NOT EXISTS idx_clubs_name ON clubs (lower(name))"
                    ))
                    conn.execute(text(
                        "CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs (lower(title))"
                    ))
                print("[migration] Basic search indexes created/verified")
        except Exception:
            pass  # SQLite or already exists — no-op

    # Composite index on club_memberships(club_id, status) for fast member count queries
    try:
        dialect = db.engine.dialect.name
        idx_sql = (
            "CREATE INDEX IF NOT EXISTS ix_club_memberships_club_status "
            "ON club_memberships (club_id, status)"
            if dialect == "postgresql" else
            "CREATE INDEX IF NOT EXISTS ix_club_memberships_club_status "
            "ON club_memberships (club_id, status)"
        )
        with db.engine.begin() as conn:
            conn.execute(text(idx_sql))
        print("[migration] club_memberships(club_id, status) index verified")
    except Exception as e:
        print(f"[migration] club_memberships composite index skipped: {e}")

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

    _normalize_club_categories()
    _lock_supabase_data_api()


def _normalize_club_categories():
    """Map old/duplicate club categories ("technology", "arts", "outdoor", …)
    onto the one list in club_categories.py. Safe to run on every start."""
    from sqlalchemy import text
    from club_categories import CATEGORIES, normalize
    try:
        with db.engine.begin() as conn:
            rows = conn.execute(text("SELECT DISTINCT category, club_type FROM clubs")).all()
            changed = 0
            for category, club_type in rows:
                new = normalize(category, club_type or "club")
                if category != new:
                    changed += conn.execute(text(
                        "UPDATE clubs SET category = :new WHERE category IS NOT DISTINCT FROM :old "
                        "AND club_type IS NOT DISTINCT FROM :type"),
                        {"new": new, "old": category, "type": club_type}).rowcount
        if changed:
            print(f"[migration] normalised {changed} club categor{'y' if changed == 1 else 'ies'}")
    except Exception as e:
        print(f"[migration] club categories step failed: {e}")


def _lock_supabase_data_api():
    """On Supabase, every table in the public schema is also reachable through
    its auto-generated REST API with the project's public "anon" key. ICOM only
    talks to the database through this backend, so turn row-level security on
    for every table with no policies: the API then sees nothing, while the
    backend (connecting as the table owner) is unaffected. No-op elsewhere."""
    from sqlalchemy import text
    if db.engine.dialect.name != "postgresql":
        return
    try:
        with db.engine.begin() as conn:
            if not conn.execute(text("SELECT 1 FROM pg_roles WHERE rolname = 'anon'")).first():
                return  # not Supabase
            tables = conn.execute(text(
                "SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace "
                "WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity"
            )).scalars().all()
            for t in tables:
                conn.execute(text(f'ALTER TABLE public."{t}" ENABLE ROW LEVEL SECURITY'))
        if tables:
            print(f"[migration] Supabase: row-level security on for {len(tables)} table(s)")
    except Exception as e:
        print(f"[migration] Supabase row-level security step failed: {e}")


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


def _seed_chat_threads():
    """Seed a handful of example Q&A threads (with answers) so the Chat page
    isn't empty on first visit. All authored by the ICOM Team system user."""
    from models import User, ChatPost, ChatAnswer

    try:
        system_user = User.query.filter_by(email="system@konect.kr").first()
        if not system_user:
            return  # the system bot is created by _seed_communities; if it
                    # doesn't exist yet, the next deploy will run this seed.

        seeds = [
            {
                "title": "How long does the D-2 visa extension actually take?",
                "scope": "jbnu",
                "content": (
                    "I'm at JBNU and my D-2 expires in 5 weeks. The Hi Korea "
                    "site says 2–4 weeks but I've heard it can take longer "
                    "around exam season. Anyone done it recently?"
                ),
                "answers": [
                    (
                        "It took me 8 working days at the Jeonju Immigration Office "
                        "in November. I booked online via Hi Korea — walk-in was a "
                        "3 hour wait. Bring the enrollment certificate fresh (same week)."
                    ),
                    (
                        "Pro tip: bring your tuition receipt AND a printed bank balance "
                        "of at least ₩10M-equivalent. They didn't ask but having it "
                        "ready saved me a return trip."
                    ),
                ],
            },
            {
                "title": "Best way to learn enough Korean to survive in 3 months?",
                "content": (
                    "I just arrived. TOPIK level 0. What worked for you in the "
                    "first semester? I'm trying to balance classes + part-time job."
                ),
                "answers": [
                    (
                        "TTMIK Level 1 + 2 on YouTube is gold for grammar. For "
                        "speaking, find a language exchange partner — JBNU has a "
                        "free Buddy Program through the International Office."
                    ),
                    (
                        "I used Naver Papago every day for daily-life translations "
                        "AND screenshotted any signs I couldn't read. After 2 months "
                        "you'll recognise most cafe/restaurant menus."
                    ),
                ],
            },
            {
                "title": "Can I open Kakao Bank without a Korean ID number?",
                "content": (
                    "I have my ARC card but the Kakao Bank app keeps asking for "
                    "주민등록번호 (Korean national ID). Is there a workaround?"
                ),
                "answers": [
                    (
                        "Yes — choose '외국인' (Foreigner) on the first screen, then "
                        "it'll switch to asking for ARC number. The flow is slightly "
                        "different. Make sure your ARC is fully issued (the physical "
                        "card delivered) not just stamped in passport."
                    ),
                ],
            },
            {
                "title": "Where can I find halal food near JBNU?",
                "scope": "jbnu",
                "content": (
                    "Muslim student, just moved to Jeonju. Are there any halal "
                    "spots near the campus? Anyone has tried Itaewon-Halal-Restaurant "
                    "delivery options?"
                ),
                "answers": [
                    (
                        "There's a small halal Uzbek place near the JBNU back gate "
                        "called Samarkand. Tashkent Restaurant in Wansan-gu also "
                        "has halal options. For groceries the Mosque area in Seoul "
                        "has the closest big halal market."
                    ),
                ],
            },
            {
                "title": "Is it safe to use Daangn Market (당근마켓) as a foreigner?",
                "content": (
                    "I want to buy a used desk and chair for my dorm. Daangn "
                    "looks much cheaper than Coupang. Any safety tips for "
                    "first-time foreign buyers?"
                ),
                "answers": [
                    (
                        "Always meet in public + daylight. The app has a built-in "
                        "chat — don't move to KakaoTalk until you've seen the item. "
                        "Don't send money before inspecting in person."
                    ),
                    (
                        "Use 'Daangn Pay' (escrow) for items over ₩50K. Seller doesn't "
                        "get paid until you confirm the item is OK. Saved me twice."
                    ),
                ],
            },
            # ── Seoul-area seed (so SNU/Yonsei/Korea Uni students see local content) ──
            {
                "title": "Cheapest way to commute Seoul ↔ Yongin every weekend?",
                "content": (
                    "I'm studying at Yonsei in Seoul but my part-time is in Yongin "
                    "(Gyeonggi-do). Round trip twice a week is killing my budget. "
                    "Anyone using a M-Bus or commuter pass?"
                ),
                "answers": [
                    (
                        "Get the T-money 'Climate Card' (기후동행카드) — ₩65,000/month "
                        "covers all Seoul subways + buses. For the Yongin leg, "
                        "M5107 from Gangnam is the fastest red bus."
                    ),
                ],
            },
            # ── Busan-area seed ───────────────────────────────────────────────────
            {
                "title": "PNU dorm vs. off-campus goshiwon in Busan — worth it?",
                "content": (
                    "Got into Pusan National University but the dorm waitlist is "
                    "long. Is a goshiwon near Jangjeon Station decent? Looking at "
                    "₩350K/month range."
                ),
                "answers": [
                    (
                        "Jangjeon goshiwons are fine but tiny — like 5m². If you can "
                        "stretch to ₩500K, a one-room officetel near PNU is way more "
                        "comfortable. Busan rents are noticeably cheaper than Seoul."
                    ),
                ],
            },
            # ── Daejeon-area seed (KAIST/CNU) ─────────────────────────────────────
            {
                "title": "Best place to buy electronics in Daejeon — Yongsan-style?",
                "content": (
                    "At KAIST and my old laptop died. Don't want to ship from Seoul "
                    "if there's somewhere local. Is there a Yongsan-style electronics "
                    "market in Daejeon?"
                ),
                "answers": [
                    (
                        "Try Junggu Electronics Street (중구 전자상가) near Daejeon "
                        "Station — about 50 small shops, can haggle. For brand-new, "
                        "Coupang next-day to Daejeon is faster than a Seoul trip."
                    ),
                ],
            },
        ]

        added = 0
        backfilled = 0
        for seed in seeds:
            seed_scope = seed.get("scope", "")
            # If it already exists, just make sure its scope is current
            # (idempotent backfill for DBs seeded before scope existed), then skip.
            existing = ChatPost.query.filter_by(title=seed["title"]).first()
            if existing:
                if (existing.scope or "") != seed_scope:
                    existing.scope = seed_scope
                    backfilled += 1
                continue
            post = ChatPost(
                user_id=system_user.id,
                title=seed["title"],
                content=seed["content"],
                image_url="",
                scope=seed_scope,
                is_active=True,
            )
            db.session.add(post)
            db.session.flush()  # so post.id is available
            for answer_text in seed["answers"]:
                db.session.add(ChatAnswer(
                    post_id=post.id,
                    user_id=system_user.id,
                    content=answer_text,
                    is_active=True,
                ))
            added += 1

        if added or backfilled:
            db.session.commit()
            print(f"[seed] Chat threads: added {added} thread(s), "
                  f"backfilled scope on {backfilled}.")
        else:
            print("[seed] Chat threads already seeded — nothing to do.")
    except Exception as e:
        db.session.rollback()
        print(f"[seed] Chat threads seed skipped: {e}")


def _seed_jeonju_jobs():
    """Insert (or update-to-English) 15 real Jeonju/Jeonbuk internship listings.

    Deduplicates by apply_link. If an existing row still has Korean text
    (Hangul characters in the title) it is updated in-place with the English
    version — so re-deploying after the Korean→English rewrite fixes existing
    rows automatically. Safe to call repeatedly.
    """
    from models import Job, User
    import sys, os
    try:
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        if backend_dir not in sys.path:
            sys.path.insert(0, backend_dir)
        from jeonju_jobs import JEONJU_JOBS

        def _has_hangul(text: str) -> bool:
            return any("가" <= ch <= "힣" for ch in (text or ""))

        # Use first admin as owner, fallback to first user
        owner = User.query.filter_by(role="admin").order_by(User.id).first()
        if not owner:
            owner = User.query.order_by(User.id).first()
        if not owner:
            print("[seed] Jeonju jobs: no users yet, skipping.")
            return

        # Index existing rows by apply_link for O(1) lookup
        existing_by_link = {
            row.apply_link: row
            for row in Job.query.filter(Job.apply_link.isnot(None)).all()
        }

        inserted = updated = 0
        for d in JEONJU_JOBS:
            link  = (d.get("apply_link") or "").strip()
            title = (d.get("title") or "").strip()
            company = (d.get("company") or "").strip()
            if not link or not title or not company:
                continue

            existing = existing_by_link.get(link)
            if existing:
                # Only update if the stored title is still Korean
                if _has_hangul(existing.title or ""):
                    existing.title              = title[:200]
                    existing.company            = company[:150]
                    existing.location           = (d.get("location") or "").strip()[:150]
                    existing.salary             = (d.get("salary") or "").strip()[:100]
                    existing.description        = (d.get("description") or "").strip()
                    existing.requirements       = (d.get("requirements") or "").strip()
                    existing.tags               = (d.get("tags") or "").strip()[:300]
                    existing.foreigner_friendly = (d.get("foreigner_friendly") or "").strip()
                    existing.foreigner_note     = (d.get("foreigner_note") or "").strip()[:300]
                    existing.is_active          = True
                    updated += 1
                continue

            job = Job(
                title=title[:200],
                company=company[:150],
                location=(d.get("location") or "").strip()[:150],
                job_type=(d.get("type") or "internship").strip(),
                salary=(d.get("salary") or "").strip()[:100],
                description=(d.get("description") or "").strip(),
                requirements=(d.get("requirements") or "").strip(),
                visa_compatible=(d.get("visa_compatible") or "D-2, D-4").strip(),
                deadline=(d.get("deadline") or "").strip()[:50],
                tags=(d.get("tags") or "").strip()[:300],
                apply_link=link,
                foreigner_friendly=(d.get("foreigner_friendly") or "").strip(),
                foreigner_note=(d.get("foreigner_note") or "").strip()[:300],
                is_active=True,
                created_by=owner.id,
            )
            db.session.add(job)
            existing_by_link[link] = job
            inserted += 1

        db.session.commit()
        if inserted or updated:
            print(f"[seed] Jeonju jobs: inserted {inserted}, updated {updated} to English.")
        else:
            print("[seed] Jeonju jobs already seeded in English — nothing to do.")
    except Exception as e:
        db.session.rollback()
        print(f"[seed] Jeonju jobs seed skipped: {e}")


def _apply_baked_translations(flask_app):
    """Apply pre-computed English translations shipped in
    backend/data/job_translations.json.

    These were generated offline with Groq (see /tmp tooling) and committed to
    the repo, so they apply with ZERO dependence on a live translation service
    — which is important because the server's Google-Translate fallback is
    blocked from datacenter IPs and GROQ_API_KEY may be unset in production.

    Rows are matched by apply_link. Idempotent: re-running just re-writes the
    same English, so it is safe to call on every boot.
    """
    import os, json
    path = os.path.join(os.path.dirname(__file__), "data", "job_translations.json")
    if not os.path.exists(path):
        return
    try:
        with open(path, "r", encoding="utf-8") as f:
            translations = json.load(f)
    except Exception as e:
        print(f"[startup] could not read baked translations: {e}")
        return

    from models import Job
    updated = 0
    with flask_app.app_context():
        for link, t in translations.items():
            try:
                job = Job.query.filter_by(apply_link=link).first()
                if not job:
                    continue
                if t.get("title"):        job.title = t["title"][:200]
                if t.get("company"):      job.company = t["company"][:150]
                if t.get("location"):     job.location = t["location"][:150]
                if t.get("description"):  job.description = t["description"]
                if t.get("requirements"): job.requirements = t["requirements"]
                if t.get("foreigner_friendly"):
                    job.foreigner_friendly = t["foreigner_friendly"]
                if t.get("foreigner_note"):
                    job.foreigner_note = t["foreigner_note"][:300]
                updated += 1
            except Exception as e:
                print(f"[startup] baked translation failed for {link[:60]}: {e}")
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"[startup] baked translation commit failed: {e}")
    if updated:
        print(f"[startup] Applied {updated} baked English translation(s) to job rows.")


def _translate_pending_jobs(flask_app):
    """Translate any Wanted-scraped jobs still stored in Korean to English.

    First applies the committed offline translations (no network needed), then
    tries the live translator for anything still Korean (new scrapes etc.).
    """
    # 1) Apply the committed, pre-translated English first (always works).
    _apply_baked_translations(flask_app)

    # 2) Best-effort live pass for anything still Korean (e.g. freshly scraped).
    try:
        from scrapers.wanted import translate_pending
        summary = translate_pending(flask_app, limit=60)
        if summary.get("translated", 0):
            print(
                f"[startup] Translated {summary['translated']} job(s) from Korean to English "
                f"(errors={summary.get('errors', 0)})"
            )
        else:
            print("[startup] No Korean job rows found to translate live.")
    except Exception as e:
        print(f"[startup] translate_pending skipped: {e}")


app = create_app()


# ── Expired-job cleanup ──────────────────────────────────────────────────────
def _cleanup_expired_jobs(flask_app):
    """Hide jobs past their deadline (Korea time) or unconfirmed for too long,
    and delete ones closed more than 30 days ago. See job_lifecycle.py."""
    with flask_app.app_context():
        try:
            from job_lifecycle import sweep
            from routes.admin import _cache_bust
            from routes.news import sweep_news
            from routes.clubs import sweep_events
            result = sweep()
            result.update(sweep_news())
            result.update(sweep_events())
            _cache_bust("jobs_list")
            print(f"[cleanup] {result}")
        except Exception as e:
            db.session.rollback()
            print(f"[cleanup] failed: {e}")


def _verify_jobs_on_wanted(flask_app):
    """Daily: ask Wanted whether each listed internship is still open, close
    the ones that ended or were deleted, then sweep. Same code as the GitHub
    Actions sync, so job expiry keeps working even if that workflow can't run.
    Verify-only: new postings are added by the scrapers, not here."""
    with flask_app.app_context():
        try:
            from models import Job
            from scrapers.sync import build_plan
            from routes.admin import apply_sync_plan
            rows = Job.query.filter(Job.apply_link.like("%wanted.co.kr/wd/%")).all()
            known = {j.apply_link: {"active": bool(j.is_active), "deadline": j.deadline or "",
                                    "korean": False} for j in rows}
            plan = build_plan(known, new_limit=0, translate_limit=0,
                              time_budget_s=int(os.environ.get("VERIFY_BUDGET_MIN", 15)) * 60)
            result = apply_sync_plan({"close": plan["close"], "seen": plan["seen"],
                                      "deadlines": plan["deadlines"]})
            print(f"[verify] {plan['stats']} → {result}")
        except Exception as e:
            db.session.rollback()
            print(f"[verify] failed: {e}")


if _startup_tasks_enabled():
    # Run once at boot so legacy expired jobs disappear immediately on next deploy.
    _cleanup_expired_jobs(app)

    # Translate any remaining Korean-language job rows to English on every boot.
    # The seeder already writes English for Jeonju jobs; this catches Wanted-scraped
    # rows that were inserted before the translation pipeline existed.
    _translate_pending_jobs(app)


def _seed_notices_if_empty(flask_app):
    """On the first boot (empty Notice table) populate the News feed in a
    background thread so it never blocks/slows startup. Later refreshes run on
    the daily scheduler."""
    def _worker():
        try:
            with flask_app.app_context():
                from models import Notice
                if Notice.query.first() is not None:
                    return
            from scrapers.jbnu_notices import run_notice_scraper
            run_notice_scraper(flask_app)
        except Exception as e:
            print(f"[jbnu] initial notice seed skipped: {e}")

    import threading
    threading.Thread(target=_worker, daemon=True, name="jbnu-initial-seed").start()


if _startup_tasks_enabled():
    _seed_notices_if_empty(app)


# ── Background scheduler ─────────────────────────────────────────────────────
def _start_scheduler(flask_app):
    """Start APScheduler exactly once: not when DISABLE_SCHEDULER=1, and not
    inside Flask's debug auto-reloader parent process (which would launch the
    scheduler twice).

    Jobs:
      • wanted_scraper: 06:00 and 18:00 UTC — pull fresh internships
      • verify_jobs: 15:10 UTC (00:10 KST) daily — close internships that ended on Wanted
      • cleanup_expired: 15:40 UTC (00:40 KST) daily — hide expired jobs, delete old closed ones
    """
    if os.environ.get("DISABLE_SCHEDULER") == "1":
        print("[scheduler] DISABLE_SCHEDULER=1 → skipping startup")
        return

    # In debug mode, only the child reloader process should start the scheduler.
    if flask_app.debug and os.environ.get("WERKZEUG_RUN_MAIN") != "true":
        return

    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from scrapers.wanted import run_scraper
    except Exception as e:
        print(f"[scheduler] failed to import dependencies — scheduler off: {e}")
        return

    scheduler = BackgroundScheduler(timezone="UTC")

    # Twice-daily Wanted scrape
    scheduler.add_job(
        lambda: run_scraper(flask_app),
        trigger="cron",
        hour="6,18",
        minute=0,
        id="wanted_scraper",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    # Twice-daily Saramin scrape (safe no-op unless SARAMIN_API_KEY is set).
    # Offset by 15 min so the two sources don't translate at the exact same time.
    try:
        from scrapers.saramin import run_scraper as run_saramin
        scheduler.add_job(
            lambda: run_saramin(flask_app),
            trigger="cron",
            hour="6,18",
            minute=15,
            id="saramin_scraper",
            replace_existing=True,
            misfire_grace_time=3600,
        )
    except Exception as e:
        print(f"[scheduler] Saramin job not scheduled: {e}")

    # Just after midnight in Korea: check every listed internship on Wanted,
    # then hide anything past its deadline and delete long-closed rows.
    scheduler.add_job(
        lambda: _verify_jobs_on_wanted(flask_app),
        trigger="cron",
        hour=15,
        minute=10,
        id="verify_jobs",
        replace_existing=True,
        misfire_grace_time=6 * 3600,
    )
    # 10:00 KST: new-internship alerts and visa expiry reminders.
    import daily_emails
    scheduler.add_job(
        lambda: daily_emails.run(flask_app),
        trigger="cron",
        hour=1,
        minute=0,
        id="daily_emails",
        replace_existing=True,
        misfire_grace_time=6 * 3600,
    )
    scheduler.add_job(
        lambda: _cleanup_expired_jobs(flask_app),
        trigger="cron",
        hour=15,
        minute=40,
        id="cleanup_expired",
        replace_existing=True,
        misfire_grace_time=6 * 3600,
    )

    # Daily JBNU notice scrape (07:00 UTC) — international / tuition / education.
    try:
        from scrapers.jbnu_notices import run_notice_scraper
        scheduler.add_job(
            lambda: run_notice_scraper(flask_app),
            trigger="cron",
            hour=7,
            minute=0,
            id="jbnu_notices",
            replace_existing=True,
            misfire_grace_time=3600,
        )
    except Exception as e:
        print(f"[scheduler] JBNU notice job not scheduled: {e}")

    scheduler.start()
    print(
        "[scheduler] started — Wanted scraper: 06:00/18:00 UTC · "
        "JBNU notices: 07:00 UTC · Expired-job cleanup: 00:30 UTC daily"
    )


_start_scheduler(app)
