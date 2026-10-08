"""One-off setup for a fresh or updated database.

Creates tables, applies the lightweight migrations, seeds clubs/communities/
chat threads/Jeonju jobs, hides expired jobs and translates Korean job rows.
Everything is idempotent, so it is safe to run on every deploy:

    STARTUP_TASKS=0 python bootstrap.py
"""
import os

os.environ.setdefault("DISABLE_SCHEDULER", "1")
os.environ["STARTUP_TASKS"] = "0"  # don't also run the tasks during import

from app import app, db, _run_lightweight_migrations, _seed_all, _cleanup_expired_jobs, _translate_pending_jobs  # noqa: E402

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        _run_lightweight_migrations()
        _seed_all()
    _cleanup_expired_jobs(app)
    _translate_pending_jobs(app)
    print("[bootstrap] done")
