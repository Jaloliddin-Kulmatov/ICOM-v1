"""Small in-memory cache for data many requests read and few requests change.

Every database round trip costs time on the free hosting, so lists like
clubs, news and chat are built once and reused. Entries expire after a short
TTL and are dropped as soon as a commit touches the tables they come from
(see install()), so nobody sees stale data after a change.

One gunicorn worker means one process, so a plain dict is enough.
"""
import threading
import time

_store: dict = {}
_lock = threading.Lock()

# Model name -> cache key prefixes to drop when a row of it changes.
WATCH = {
    "Club": ("clubs",),
    "ClubMembership": ("clubs",),
    "Notice": ("news",),
    "ChatPost": ("chat",),
    "ChatAnswer": ("chat",),
    "User": ("user:", "clubs", "chat"),  # names and universities appear in lists
}


def get(key):
    with _lock:
        hit = _store.get(key)
        if hit and hit[0] > time.time():
            return hit[1]
        _store.pop(key, None)
    return None


def put(key, value, ttl: float):
    with _lock:
        _store[key] = (time.time() + ttl, value)
    return value


def cached(key, ttl: float, build):
    value = get(key)
    return value if value is not None else put(key, build(), ttl)


def bust(*prefixes):
    with _lock:
        for k in [k for k in _store if any(k.startswith(p) for p in prefixes)]:
            _store.pop(k, None)


def install(db):
    """Drop affected cache entries after every commit that changes watched models."""
    from sqlalchemy import event
    from sqlalchemy.orm import Session

    @event.listens_for(Session, "before_flush")
    def _collect(session, _ctx, _instances):
        hit = session.info.setdefault("cache_bust", set())
        for obj in list(session.new) + list(session.dirty) + list(session.deleted):
            hit.update(WATCH.get(type(obj).__name__, ()))

    @event.listens_for(Session, "after_commit")
    def _apply(session):
        prefixes = session.info.pop("cache_bust", None)
        if prefixes:
            bust(*prefixes)

    @event.listens_for(Session, "after_rollback")
    def _discard(session):
        session.info.pop("cache_bust", None)

    @event.listens_for(Session, "after_bulk_update")
    @event.listens_for(Session, "after_bulk_delete")
    def _bulk(ctx):
        # Query.update()/delete(): find the model if we can, else drop everything watched.
        mapper = getattr(ctx, "mapper", None)
        if mapper is None:
            query = getattr(ctx, "query", None)
            descs = getattr(query, "column_descriptions", None) or [{}]
            entity = descs[0].get("entity")
            name = getattr(entity, "__name__", "")
        else:
            name = mapper.class_.__name__
        bust(*(WATCH.get(name) or {p for ps in WATCH.values() for p in ps}))
