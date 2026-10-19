"""When an internship stops being listed, and when it is deleted for good.

A job is hidden (is_active=False, closed_at set) when:
  * its deadline (YYYY-MM-DD) is before today in Korea, or
  * the source site closed, hid or removed it (found by the sync), or
  * it has no deadline and nobody has confirmed it open for STALE_DAYS.
Hidden jobs are deleted from the database PURGE_DAYS after they closed.
"""
from datetime import date, datetime, timedelta, timezone

from app import db
from models import Job

KST = timezone(timedelta(hours=9))
STALE_DAYS = 60   # no deadline and not confirmed open for this long → hide
PURGE_DAYS = 30   # closed this long ago → delete the row


def kst_today() -> date:
    return datetime.now(KST).date()


def deadline_passed(deadline) -> bool:
    """True for ISO deadlines (YYYY-MM-DD…) before today in Korea. A posting
    stays up for the whole of its deadline day. Free-text or empty deadlines
    ("Rolling") never count as passed."""
    raw = (deadline or "").strip()[:10]
    if len(raw) != 10:
        return False
    try:
        return date.fromisoformat(raw) < kst_today()
    except ValueError:
        return False


def _has_deadline(deadline) -> bool:
    raw = (deadline or "").strip()[:10]
    try:
        date.fromisoformat(raw)
        return True
    except ValueError:
        return False


def is_stale(job: Job, now: datetime | None = None) -> bool:
    """No deadline, and the last confirmation that it's open is too old."""
    if _has_deadline(job.deadline):
        return False
    now = now or datetime.utcnow()
    last = job.checked_at or job.created_at
    return last is not None and now - last > timedelta(days=STALE_DAYS)


def is_listed(job: Job) -> bool:
    return bool(job.is_active) and not deadline_passed(job.deadline) and not is_stale(job)


def close(job: Job, now: datetime | None = None) -> bool:
    if not job.is_active:
        return False
    job.is_active = False
    job.closed_at = now or datetime.utcnow()
    return True


def sweep() -> dict:
    """Hide expired and stale jobs, then delete long-closed ones. Commits."""
    now = datetime.utcnow()
    out = {"expired": 0, "stale": 0, "deleted": 0}
    for job in Job.query.filter_by(is_active=True).all():
        if deadline_passed(job.deadline):
            close(job, now)
            out["expired"] += 1
        elif is_stale(job, now):
            close(job, now)
            out["stale"] += 1
    cutoff = now - timedelta(days=PURGE_DAYS)
    out["deleted"] = (Job.query
                      .filter(Job.is_active.is_(False), Job.closed_at.isnot(None), Job.closed_at < cutoff)
                      .delete(synchronize_session=False))
    db.session.commit()
    return out
