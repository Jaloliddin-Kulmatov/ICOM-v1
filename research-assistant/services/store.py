"""SQLite persistence: a saved library + an analysis cache.

The cache makes re-opening any AI output instant and free. The library keeps
papers across sessions. One file, no migrations framework — just `init()`.
"""
from __future__ import annotations

import json
import os
import sqlite3
import threading
import time
from typing import Any

DB_PATH = os.environ.get(
    "RA_DB", os.path.join(os.path.dirname(os.path.dirname(__file__)), "research.db")
)

_lock = threading.Lock()


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn


def init() -> None:
    with _lock, _connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS papers (
                id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS library (
                id TEXT PRIMARY KEY, saved_at REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS analyses (
                paper_id TEXT NOT NULL, kind TEXT NOT NULL, fmt TEXT NOT NULL,
                payload TEXT NOT NULL, created_at REAL NOT NULL,
                PRIMARY KEY (paper_id, kind)
            );
            CREATE TABLE IF NOT EXISTS submissions (
                id TEXT PRIMARY KEY, data TEXT NOT NULL, created_at REAL NOT NULL
            );
            """
        )


def remember_paper(paper: dict[str, Any]) -> None:
    if not paper or not paper.get("id"):
        return
    with _lock, _connect() as conn:
        conn.execute(
            "INSERT INTO papers (id, data, updated_at) VALUES (?, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at",
            (paper["id"], json.dumps(paper), time.time()),
        )


def get_paper(paper_id: str) -> dict[str, Any] | None:
    with _lock, _connect() as conn:
        row = conn.execute("SELECT data FROM papers WHERE id=?", (paper_id,)).fetchone()
    return json.loads(row["data"]) if row else None


def is_saved(paper_id: str) -> bool:
    with _lock, _connect() as conn:
        row = conn.execute("SELECT 1 FROM library WHERE id=?", (paper_id,)).fetchone()
    return row is not None


def toggle_library(paper: dict[str, Any]) -> bool:
    pid = paper["id"]
    remember_paper(paper)
    with _lock, _connect() as conn:
        exists = conn.execute("SELECT 1 FROM library WHERE id=?", (pid,)).fetchone()
        if exists:
            conn.execute("DELETE FROM library WHERE id=?", (pid,))
            return False
        conn.execute("INSERT INTO library (id, saved_at) VALUES (?, ?)", (pid, time.time()))
        return True


def list_library() -> list[dict[str, Any]]:
    with _lock, _connect() as conn:
        rows = conn.execute(
            "SELECT p.data FROM library l JOIN papers p ON p.id = l.id ORDER BY l.saved_at DESC"
        ).fetchall()
    return [json.loads(r["data"]) for r in rows]


def saved_ids() -> set[str]:
    with _lock, _connect() as conn:
        rows = conn.execute("SELECT id FROM library").fetchall()
    return {r["id"] for r in rows}


def cache_get(paper_id: str, kind: str) -> dict[str, Any] | None:
    with _lock, _connect() as conn:
        row = conn.execute(
            "SELECT fmt, payload, created_at FROM analyses WHERE paper_id=? AND kind=?",
            (paper_id, kind),
        ).fetchone()
    if not row:
        return None
    data = json.loads(row["payload"]) if row["fmt"] == "json" else row["payload"]
    return {"fmt": row["fmt"], "data": data, "created_at": row["created_at"]}


def cache_put(paper_id: str, kind: str, fmt: str, data: Any) -> None:
    payload = json.dumps(data) if fmt == "json" else str(data)
    with _lock, _connect() as conn:
        conn.execute(
            "INSERT INTO analyses (paper_id, kind, fmt, payload, created_at) "
            "VALUES (?, ?, ?, ?, ?) "
            "ON CONFLICT(paper_id, kind) DO UPDATE SET "
            "fmt=excluded.fmt, payload=excluded.payload, created_at=excluded.created_at",
            (paper_id, kind, fmt, payload, time.time()),
        )


# ---------- community submissions (student-published research) ----------

def add_submission(data: dict[str, Any]) -> None:
    with _lock, _connect() as conn:
        conn.execute(
            "INSERT INTO submissions (id, data, created_at) VALUES (?, ?, ?)",
            (data["id"], json.dumps(data), time.time()),
        )


def get_submission(sub_id: str) -> dict[str, Any] | None:
    with _lock, _connect() as conn:
        row = conn.execute("SELECT data FROM submissions WHERE id=?", (sub_id,)).fetchone()
    return json.loads(row["data"]) if row else None


def list_submissions() -> list[dict[str, Any]]:
    with _lock, _connect() as conn:
        rows = conn.execute(
            "SELECT data FROM submissions ORDER BY created_at DESC"
        ).fetchall()
    return [json.loads(r["data"]) for r in rows]
