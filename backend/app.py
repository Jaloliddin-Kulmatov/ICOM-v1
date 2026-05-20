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

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(clubs_bp, url_prefix="/api/clubs")
    app.register_blueprint(ambassador_bp, url_prefix="/api/ambassador")
    app.register_blueprint(posts_bp, url_prefix="/api/posts")

    @app.route("/")
    def index():
        return jsonify({"status": "ok", "service": "ICOM API", "version": "1.0", "frontend": "http://localhost:3000"})

    with app.app_context():
        db.create_all()
        _run_lightweight_migrations()

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

app = create_app()
