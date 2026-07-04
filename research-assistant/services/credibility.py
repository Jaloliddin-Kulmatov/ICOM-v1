"""A transparent credibility score (0-100) from real, inspectable signals.

This is deliberately NOT a black box. Every point is attributed to a factor with
its own cap and an explanation, so the breakdown is the product — not the number.
New papers legitimately score low on citation axes; we say so rather than imply
they're low quality.
"""
from __future__ import annotations

import math
import re
from datetime import datetime
from typing import Any

_CODE_HINT = re.compile(r"github\.com|gitlab\.com|code (is )?available|/code|colab", re.I)
_DATA_HINT = re.compile(r"\bdataset\b|\bbenchmark\b|\bcorpus\b|we release|publicly available", re.I)


def _pub_year(paper: dict[str, Any], scholar: dict[str, Any]) -> int | None:
    if scholar.get("year"):
        return int(scholar["year"])
    pub = paper.get("published", "")
    if len(pub) >= 4 and pub[:4].isdigit():
        return int(pub[:4])
    return None


def score(paper: dict[str, Any], scholar: dict[str, Any]) -> dict[str, Any]:
    cc = scholar.get("citation_count", 0) or 0
    ic = scholar.get("influential_citation_count", 0) or 0
    venue = (scholar.get("venue") or "").strip()
    year = _pub_year(paper, scholar)
    now = datetime.utcnow().year
    age = max(0.5, (now - year)) if year else None

    text = f"{paper.get('summary','')} {paper.get('comment','')} {scholar.get('open_access_pdf','')}"
    has_code = bool(_CODE_HINT.search(text)) or bool(scholar.get("open_access_pdf"))
    has_data = bool(_DATA_HINT.search(text))
    n_authors = scholar.get("author_count") or len(paper.get("authors") or [])

    factors: list[dict[str, Any]] = []

    def add(label, pts, mx, detail):
        factors.append({"label": label, "points": round(pts), "max": mx, "detail": detail})

    # Citation impact (log-scaled so it doesn't blow out).
    cite_pts = min(30, 12 * math.log10(cc + 1))
    add("Citation impact", cite_pts, 30, f"{cc} citations")

    # Influential citations (citations that actually build on the work).
    add("Influential citations", min(15, ic * 3), 15, f"{ic} influential")

    # Citation velocity — impact per year since publication.
    if age:
        vel = cc / age
        add("Citation velocity", min(15, vel * 2), 15, f"~{vel:.1f}/yr over {age:.0f}y")
    else:
        add("Citation velocity", 0, 15, "publication date unknown")

    # Peer-reviewed venue (vs preprint-only).
    if venue and venue.lower() not in {"arxiv", "arxiv.org"}:
        add("Peer-reviewed venue", 12, 12, venue)
    else:
        add("Peer-reviewed venue", 0, 12, "preprint / venue not found")

    add("Code availability", 10 if has_code else 0, 10,
        "code link found" if has_code else "no code link detected")
    add("Reproducibility signals", 6 if has_data else 0, 6,
        "dataset/benchmark released" if has_data else "no dataset mention")

    if n_authors >= 2:
        coll = 6 if n_authors <= 12 else 4
        add("Collaboration", coll, 6, f"{n_authors} authors")
    else:
        add("Collaboration", 2, 6, f"{n_authors or 1} author")

    if age is not None:
        fresh = 6 if age <= 2 else 3 if age <= 4 else 0
        add("Freshness", fresh, 6, f"{age:.0f}y old")
    else:
        add("Freshness", 0, 6, "unknown date")

    total = round(sum(f["points"] for f in factors))
    total = max(0, min(100, total))

    if total >= 75:
        grade, label = "A", "Highly established"
    elif total >= 60:
        grade, label = "B", "Well supported"
    elif total >= 45:
        grade, label = "C", "Moderate evidence"
    elif total >= 28:
        grade, label = "D", "Limited / emerging"
    else:
        grade, label = "—", "Early / preprint"

    note = (
        "Blends citation impact with venue, code, and reproducibility signals. "
        "Recent papers score low on citation axes by nature — read the breakdown, "
        "not just the number."
    )
    if not scholar.get("available"):
        note = "Citation data unavailable right now — score reflects metadata signals only."

    return {
        "total": total,
        "grade": grade,
        "label": label,
        "factors": factors,
        "note": note,
    }
