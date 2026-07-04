"""Lens — Flask backend.

For university students: discover papers on arXiv, open any into a workspace
(credibility score, citation map, full-PDF AI analysis), AND publish their own
research to a community feed — with an optional AI pre-submission review.

No-key features: search, details, credibility, citation map, related, community
feed, publishing, library, exports. AI features (need ANTHROPIC_API_KEY): reviewer
scorecard, weaknesses, beginner, reproduce, debate, compare, gaps, reading plan,
pre-submission review.
"""
from __future__ import annotations

import datetime as _dt
import os
import re
import uuid

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory

load_dotenv()

from services import (  # noqa: E402
    analysis, credibility, llm, pdf, scholar, sources, store,
)

BASE = os.path.dirname(__file__)
UPLOADS = os.path.join(BASE, "uploads")
os.makedirs(UPLOADS, exist_ok=True)

app = Flask(__name__, static_folder="static", static_url_path="/static")
app.config["MAX_CONTENT_LENGTH"] = 25 * 1024 * 1024  # 25 MB upload cap
store.init()

_ANALYZERS = {
    "weaknesses": analysis.weaknesses,
    "beginner": analysis.beginner,
    "implementation": analysis.implementation,
    "debate": analysis.debate,
}

FIELDS = [
    "Computer Science", "Mathematics", "Physics", "Biology", "Chemistry",
    "Engineering", "Economics", "Medicine", "Social Science", "Other",
]


def _fail(message: str, status: int = 400):
    return jsonify({"error": message}), status


def _is_community(pid: str) -> bool:
    return pid.startswith("lens-")


def _annotate(papers, saved=None):
    saved = store.saved_ids() if saved is None else saved
    for p in papers:
        p["saved"] = p.get("id") in saved
    return papers


def _require_paper(arxiv_id: str):
    if _is_community(arxiv_id):
        sub = store.get_submission(arxiv_id)
        if not sub:
            raise LookupError("Submission not found")
        return sub
    found = store.get_paper(arxiv_id) or sources.get_by_id(arxiv_id)
    if not found:
        raise LookupError("Paper not found")
    store.remember_paper(found)
    return found


def _pdf_source(paper) -> str:
    return paper.get("pdf_path") or paper.get("pdf_url", "")


def _full_text(paper):
    return pdf.fetch_text(_pdf_source(paper))


# ───────────── pages / health / uploads ─────────────

@app.get("/")
def index():
    return send_from_directory("templates", "index.html")


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "ai_enabled": llm.available(), "model": llm.MODEL, "fields": FIELDS})


@app.get("/uploads/<path:name>")
def uploaded(name: str):
    return send_from_directory(UPLOADS, name)


# ───────────── discovery (no key) ─────────────

@app.get("/api/search")
def search():
    q = request.args.get("q", "").strip()
    if not q:
        return _fail("Provide a search query with ?q=")
    sort = request.args.get("sort", "relevance")
    try:
        limit = int(request.args.get("limit", 12))
    except ValueError:
        limit = 12
    try:
        results = sources.search(q, max_results=limit, sort=sort)
    except Exception as exc:  # noqa: BLE001
        return _fail(f"Search failed: {exc}", 502)
    for p in results:
        store.remember_paper(p)
    return jsonify({"query": q, "count": len(results), "results": _annotate(results)})


@app.get("/api/paper/<path:arxiv_id>")
def paper(arxiv_id: str):
    try:
        found = _require_paper(arxiv_id)
    except LookupError as exc:
        return _fail(str(exc), 404)
    return jsonify(_annotate([found])[0])


@app.get("/api/details/<path:arxiv_id>")
def details(arxiv_id: str):
    try:
        paper_obj = _require_paper(arxiv_id)
    except LookupError as exc:
        return _fail(str(exc), 404)
    if _is_community(paper_obj["id"]):
        sch = {"available": False, "community": True}
        cred = credibility.score(paper_obj, sch)
        cred["note"] = (
            "Student submission — not yet indexed by citation databases. Score "
            "reflects openness, reproducibility, and metadata signals only."
        )
    else:
        sch = scholar.details(arxiv_id)
        cred = credibility.score(paper_obj, sch)
    return jsonify({"paper": _annotate([paper_obj])[0], "scholar": sch, "credibility": cred})


@app.get("/api/graph/<path:arxiv_id>")
def graph(arxiv_id: str):
    if _is_community(arxiv_id):
        return jsonify({"available": False, "community": True})
    try:
        _require_paper(arxiv_id)
    except LookupError as exc:
        return _fail(str(exc), 404)
    return jsonify(scholar.graph(arxiv_id))


@app.get("/api/related/<path:arxiv_id>")
def related(arxiv_id: str):
    if _is_community(arxiv_id):
        return jsonify({"results": [], "community": True})
    try:
        _require_paper(arxiv_id)
    except LookupError as exc:
        return _fail(str(exc), 404)
    return jsonify({"results": scholar.recommendations(arxiv_id, limit=8)})


# ───────────── community: browse + publish ─────────────

@app.get("/api/community")
def community():
    q = request.args.get("q", "").strip().lower()
    field = request.args.get("field", "").strip()
    subs = store.list_submissions()
    if field:
        subs = [s for s in subs if s.get("primary_category") == field]
    if q:
        def hit(s):
            hay = " ".join([
                s.get("title", ""), s.get("summary", ""),
                " ".join(s.get("authors", [])), s.get("university", ""),
                " ".join(s.get("keywords", [])),
            ]).lower()
            return q in hay
        subs = [s for s in subs if hit(s)]
    return jsonify({"count": len(subs), "results": _annotate(subs)})


def _clean(s: str, limit: int) -> str:
    return " ".join((s or "").split())[:limit]


@app.post("/api/publish")
def publish():
    f = request.form
    title = _clean(f.get("title", ""), 300)
    abstract = _clean(f.get("abstract", ""), 6000)
    authors = [a.strip() for a in (f.get("authors", "") or "").split(",") if a.strip()]
    university = _clean(f.get("university", ""), 200)
    field = f.get("field", "").strip() or "Other"
    keywords = [k.strip() for k in (f.get("keywords", "") or "").split(",") if k.strip()][:12]
    contact = _clean(f.get("contact", ""), 200)
    link = _clean(f.get("link", ""), 500)
    license_ = _clean(f.get("license", "") or "All rights reserved", 100)

    if not title:
        return _fail("A title is required.")
    if not authors:
        return _fail("At least one author is required.")
    if len(abstract) < 80:
        return _fail("The abstract should be at least 80 characters.")
    if not university:
        return _fail("Your university / institution is required.")
    if contact and not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", contact):
        return _fail("Contact must be a valid email (or leave it blank).")
    if field not in FIELDS:
        field = "Other"

    sub_id = "lens-" + uuid.uuid4().hex[:10]
    pdf_url, pdf_path, abs_url = "", "", link

    upload = request.files.get("pdf")
    if upload and upload.filename:
        if not upload.filename.lower().endswith(".pdf"):
            return _fail("Only PDF files can be uploaded.")
        fname = f"{sub_id}.pdf"
        dest = os.path.join(UPLOADS, fname)
        upload.save(dest)
        pdf_path = dest
        pdf_url = f"/uploads/{fname}"
    elif link and (link.startswith("http://") or link.startswith("https://")):
        pdf_url = link
    elif link:
        return _fail("The paper link must start with http:// or https://")

    now = _dt.datetime.utcnow().isoformat()
    submission = {
        "id": sub_id,
        "source": "community",
        "title": title,
        "summary": abstract,
        "authors": authors,
        "published": now,
        "updated": now,
        "pdf_url": pdf_url,
        "pdf_path": pdf_path,
        "abs_url": abs_url,
        "categories": [field],
        "primary_category": field,
        "comment": "",
        "university": university,
        "contact": contact,
        "keywords": keywords,
        "license": license_,
    }
    try:
        store.add_submission(submission)
        store.remember_paper(submission)
    except Exception as exc:  # noqa: BLE001
        return _fail(f"Could not save submission: {exc}", 500)
    return jsonify({"ok": True, "paper": _annotate([submission])[0]})


@app.post("/api/prereview")
def prereview():
    """AI review of a draft BEFORE publishing — students improve, then submit."""
    data = request.get_json(silent=True) or {}
    title = _clean(data.get("title", ""), 300)
    abstract = _clean(data.get("abstract", ""), 6000)
    if not title or len(abstract) < 80:
        return _fail("Provide a title and an abstract (80+ chars) to get feedback.")
    draft = {
        "id": "draft",
        "title": title,
        "summary": abstract,
        "authors": [a.strip() for a in (data.get("authors", "") or "").split(",") if a.strip()],
        "categories": [data.get("field", "") or "Other"],
        "primary_category": data.get("field", "") or "Other",
        "published": "",
        "comment": "pre-submission draft",
    }
    try:
        result = analysis.review(draft)
    except llm.LLMUnavailable as exc:
        return _fail(str(exc), 503)
    except Exception as exc:  # noqa: BLE001
        return _fail(f"Pre-review failed: {exc}", 500)
    return jsonify({"review": result})


# ───────────── AI analysis (needs key) ─────────────

@app.post("/api/review")
def review():
    data = request.get_json(silent=True) or {}
    arxiv_id = (data.get("id") or "").strip()
    fresh = bool(data.get("fresh"))
    fulltext = bool(data.get("fulltext"))
    if not arxiv_id:
        return _fail("Missing paper id")
    cache_key = "review:ft" if fulltext else "review"
    try:
        paper_obj = _require_paper(arxiv_id)
        cached = None if fresh else store.cache_get(arxiv_id, cache_key)
        if cached:
            result, was_cached = cached["data"], True
        else:
            text = _full_text(paper_obj) if fulltext else None
            result = analysis.review(paper_obj, full_text=text)
            store.cache_put(arxiv_id, cache_key, "json", result)
            was_cached = False
    except LookupError as exc:
        return _fail(str(exc), 404)
    except pdf.PdfError as exc:
        return _fail(str(exc), 502)
    except llm.LLMUnavailable as exc:
        return _fail(str(exc), 503)
    except Exception as exc:  # noqa: BLE001
        return _fail(f"Review failed: {exc}", 500)
    return jsonify({"paper": paper_obj, "review": result, "cached": was_cached, "fulltext": fulltext})


@app.post("/api/analyze")
def analyze():
    data = request.get_json(silent=True) or {}
    arxiv_id = (data.get("id") or "").strip()
    kind = (data.get("kind") or "").strip()
    fresh = bool(data.get("fresh"))
    fulltext = bool(data.get("fulltext"))
    if not arxiv_id:
        return _fail("Missing paper id")
    fn = _ANALYZERS.get(kind)
    if not fn:
        return _fail(f"Unknown analysis kind '{kind}'")
    cache_key = f"{kind}:ft" if fulltext else kind
    try:
        paper_obj = _require_paper(arxiv_id)
        cached = None if fresh else store.cache_get(arxiv_id, cache_key)
        if cached:
            markdown, was_cached = cached["data"], True
        else:
            text = _full_text(paper_obj) if fulltext else None
            markdown = fn(paper_obj, full_text=text)
            store.cache_put(arxiv_id, cache_key, "md", markdown)
            was_cached = False
    except LookupError as exc:
        return _fail(str(exc), 404)
    except pdf.PdfError as exc:
        return _fail(str(exc), 502)
    except llm.LLMUnavailable as exc:
        return _fail(str(exc), 503)
    except Exception as exc:  # noqa: BLE001
        return _fail(f"Analysis failed: {exc}", 500)
    return jsonify({"kind": kind, "markdown": markdown, "cached": was_cached, "fulltext": fulltext})


@app.post("/api/compare")
def compare():
    data = request.get_json(silent=True) or {}
    ids = [str(i).strip() for i in (data.get("ids") or []) if str(i).strip()]
    if len(ids) < 2:
        return _fail("Pick at least 2 papers to compare")
    if len(ids) > 6:
        return _fail("Compare at most 6 papers at a time")
    try:
        papers = [_require_paper(i) for i in ids]
        markdown = analysis.compare(papers)
    except LookupError as exc:
        return _fail(str(exc), 404)
    except llm.LLMUnavailable as exc:
        return _fail(str(exc), 503)
    except Exception as exc:  # noqa: BLE001
        return _fail(f"Compare failed: {exc}", 500)
    return jsonify({"markdown": markdown})


@app.post("/api/gaps")
def gaps():
    data = request.get_json(silent=True) or {}
    ids = [str(i).strip() for i in (data.get("ids") or []) if str(i).strip()]
    topic = (data.get("topic") or "").strip()
    if len(ids) < 2:
        return _fail("Pick at least 2 papers for a gap analysis")
    if len(ids) > 10:
        return _fail("Use at most 10 papers for a gap analysis")
    try:
        papers = [_require_paper(i) for i in ids]
        markdown = analysis.gaps(papers, topic=topic)
    except LookupError as exc:
        return _fail(str(exc), 404)
    except llm.LLMUnavailable as exc:
        return _fail(str(exc), 503)
    except Exception as exc:  # noqa: BLE001
        return _fail(f"Gap analysis failed: {exc}", 500)
    return jsonify({"markdown": markdown})


@app.post("/api/reading-plan")
def reading_plan():
    data = request.get_json(silent=True) or {}
    ids = [str(i).strip() for i in (data.get("ids") or []) if str(i).strip()]
    if len(ids) < 2:
        return _fail("Pick at least 2 papers for a reading plan")
    if len(ids) > 10:
        return _fail("Use at most 10 papers for a reading plan")
    try:
        papers = [_require_paper(i) for i in ids]
        markdown = analysis.reading_plan(papers)
    except LookupError as exc:
        return _fail(str(exc), 404)
    except llm.LLMUnavailable as exc:
        return _fail(str(exc), 503)
    except Exception as exc:  # noqa: BLE001
        return _fail(f"Reading plan failed: {exc}", 500)
    return jsonify({"markdown": markdown})


# ───────────── library (no key) ─────────────

@app.get("/api/library")
def library():
    return jsonify({"results": _annotate(store.list_library())})


@app.post("/api/library/toggle")
def library_toggle():
    data = request.get_json(silent=True) or {}
    arxiv_id = (data.get("id") or "").strip()
    if not arxiv_id:
        return _fail("Missing paper id")
    try:
        paper_obj = _require_paper(arxiv_id)
        saved = store.toggle_library(paper_obj)
    except LookupError as exc:
        return _fail(str(exc), 404)
    except Exception as exc:  # noqa: BLE001
        return _fail(f"Could not update library: {exc}", 500)
    return jsonify({"id": arxiv_id, "saved": saved})


@app.errorhandler(413)
def too_large(_e):
    return _fail("That file is too large (max 25 MB).", 413)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5057))
    debug = os.environ.get("FLASK_DEBUG", "") not in {"", "0", "false", "False"}
    app.run(host="127.0.0.1", port=port, debug=debug)
