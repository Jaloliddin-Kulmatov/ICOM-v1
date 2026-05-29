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
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {"pool_pre_ping": True}
    if db_url.startswith("postgresql://"):
        app.config["SQLALCHEMY_POOL_SIZE"] = 5
        app.config["SQLALCHEMY_MAX_OVERFLOW"] = 10
        app.config["SQLALCHEMY_POOL_RECYCLE"] = 300
        app.config["SQLALCHEMY_POOL_TIMEOUT"] = 20
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
    from routes.feedback import feedback_bp
    from routes.chat import chat_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(clubs_bp, url_prefix="/api/clubs")
    app.register_blueprint(ambassador_bp, url_prefix="/api/ambassador")
    app.register_blueprint(posts_bp, url_prefix="/api/posts")
    app.register_blueprint(search_bp, url_prefix="/api/search")
    app.register_blueprint(feedback_bp, url_prefix="/api/feedback")
    app.register_blueprint(chat_bp, url_prefix="/api/chat")

    @app.route("/")
    def index():
        return jsonify({"status": "ok", "service": "ICOM API", "version": "1.0", "frontend": "http://localhost:3000"})

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok"}), 200

    with app.app_context():
        db.create_all()
        _run_lightweight_migrations()
        _seed_communities()
        _seed_university_clubs()
        _seed_chat_threads()

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

    # foreigner_friendly + foreigner_note on jobs (AI-detected from Korean
    # job posts during scraping). apply_count tracks how many users clicked
    # the Apply button — shown as "N applied" on cards.
    for col_name, col_def in [
        ("foreigner_friendly", "VARCHAR(20) DEFAULT ''"),
        ("foreigner_note",     "VARCHAR(300) DEFAULT ''"),
        ("apply_count",        "INTEGER DEFAULT 0"),
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
        for seed in seeds:
            # Skip if a post with this exact title already exists.
            if ChatPost.query.filter_by(title=seed["title"]).first():
                continue
            post = ChatPost(
                user_id=system_user.id,
                title=seed["title"],
                content=seed["content"],
                image_url="",
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

        if added:
            db.session.commit()
            print(f"[seed] Chat threads: added {added} example Q&A thread(s).")
        else:
            print("[seed] Chat threads already seeded — nothing to do.")
    except Exception as e:
        db.session.rollback()
        print(f"[seed] Chat threads seed skipped: {e}")


app = create_app()


# ── Expired-job cleanup ──────────────────────────────────────────────────────
def _cleanup_expired_jobs(flask_app):
    """Soft-delete jobs whose deadline date is in the past.

    Deadlines are stored as VARCHAR(50) and come in mixed shapes:
      - "2025-08-31"        (scraped from Wanted — always ISO)
      - "Jun 30"            (admin free text — skipped, can't parse year)
      - "Open" / "" / None  (skipped)

    We only deactivate rows whose deadline parses cleanly as YYYY-MM-DD and
    that date is strictly before today (UTC). Free-text deadlines are left
    alone — they're admin-managed.
    """
    from datetime import date, datetime
    from models import Job

    with flask_app.app_context():
        try:
            today = datetime.utcnow().date()
            active = Job.query.filter_by(is_active=True).all()
            deactivated = 0
            for job in active:
                raw = (job.deadline or "").strip()
                if len(raw) < 10:
                    continue
                try:
                    dl = date.fromisoformat(raw[:10])
                except ValueError:
                    continue  # not an ISO date — leave it
                if dl < today:
                    job.is_active = False
                    deactivated += 1
            if deactivated:
                db.session.commit()
                print(f"[cleanup] deactivated {deactivated} expired job(s)")
            else:
                print("[cleanup] no expired jobs found")
        except Exception as e:
            db.session.rollback()
            print(f"[cleanup] failed: {e}")


# Run once at boot so legacy expired jobs disappear immediately on next deploy.
_cleanup_expired_jobs(app)


# ── Background scheduler ─────────────────────────────────────────────────────
def _start_scheduler(flask_app):
    """Start APScheduler exactly once: not when DISABLE_SCHEDULER=1, and not
    inside Flask's debug auto-reloader parent process (which would launch the
    scheduler twice).

    Jobs:
      • wanted_scraper: 06:00 and 18:00 UTC — pull fresh internships
      • cleanup_expired: 00:30 UTC daily — hide jobs past their deadline
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

    # Daily expired-job sweep — runs at 00:30 UTC so it lands between days
    # and doesn't overlap with the scraper.
    scheduler.add_job(
        lambda: _cleanup_expired_jobs(flask_app),
        trigger="cron",
        hour=0,
        minute=30,
        id="cleanup_expired",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    scheduler.start()
    print(
        "[scheduler] started — Wanted scraper: 06:00/18:00 UTC · "
        "Expired-job cleanup: 00:30 UTC daily"
    )


_start_scheduler(app)
