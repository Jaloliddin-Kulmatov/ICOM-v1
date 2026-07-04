"""Semantic Scholar Graph API — free, no key required.

Powers citation counts, the credibility score, the citation map, and related
papers. The public pool is rate-limited and occasionally flaky, so every call
degrades gracefully: on failure we return empty data with `available=False`
rather than breaking the request.
"""
from __future__ import annotations

import threading
import time
from typing import Any

import requests

GRAPH = "https://api.semanticscholar.org/graph/v1"
REC = "https://api.semanticscholar.org/recommendations/v1"
_HEADERS = {"User-Agent": "research-assistant/1.0"}

_CACHE: dict[str, tuple[float, Any]] = {}
_CACHE_TTL = 1800

# The public pool rate-limits aggressively, so we self-throttle to ~1 req/sec
# and back off on 429. A single global lock serializes outbound calls.
_MIN_INTERVAL = 1.1
_throttle = threading.Lock()
_last_call = [0.0]


def _pace() -> None:
    with _throttle:
        wait = _MIN_INTERVAL - (time.time() - _last_call[0])
        if wait > 0:
            time.sleep(wait)
        _last_call[0] = time.time()


def _bare(arxiv_id: str) -> str:
    """Strip the version suffix — Semantic Scholar keys on the base arXiv id."""
    return (arxiv_id or "").split("v")[0].strip()


def _get(url: str, params: dict[str, Any]) -> Any | None:
    key = url + repr(sorted(params.items()))
    hit = _CACHE.get(key)
    if hit and time.time() - hit[0] < _CACHE_TTL:
        return hit[1]
    backoff = [1.0, 2.0, 3.5]  # seconds, on 429 / transient error
    for attempt in range(4):
        _pace()
        try:
            r = requests.get(url, params=params, headers=_HEADERS, timeout=15)
            if r.status_code == 429:
                if attempt < len(backoff):
                    time.sleep(backoff[attempt])
                continue
            r.raise_for_status()
            data = r.json()
            _CACHE[key] = (time.time(), data)
            return data
        except requests.RequestException:
            if attempt < len(backoff):
                time.sleep(backoff[attempt])
    return None


def details(arxiv_id: str) -> dict[str, Any]:
    fields = (
        "title,abstract,year,publicationDate,venue,publicationVenue,citationCount,"
        "influentialCitationCount,referenceCount,fieldsOfStudy,tldr,openAccessPdf,"
        "authors,externalIds,url"
    )
    data = _get(f"{GRAPH}/paper/arXiv:{_bare(arxiv_id)}", {"fields": fields})
    if not data:
        return {"available": False}
    venue = data.get("venue") or (data.get("publicationVenue") or {}).get("name") or ""
    tldr = (data.get("tldr") or {}).get("text") or ""
    return {
        "available": True,
        "s2_id": data.get("paperId", ""),
        "year": data.get("year"),
        "publication_date": data.get("publicationDate"),
        "venue": venue,
        "citation_count": data.get("citationCount") or 0,
        "influential_citation_count": data.get("influentialCitationCount") or 0,
        "reference_count": data.get("referenceCount") or 0,
        "fields_of_study": data.get("fieldsOfStudy") or [],
        "tldr": tldr,
        "open_access_pdf": (data.get("openAccessPdf") or {}).get("url") or "",
        "author_count": len(data.get("authors") or []),
        "s2_url": data.get("url", ""),
    }


def _node(p: dict[str, Any]) -> dict[str, Any] | None:
    if not p or not p.get("title"):
        return None
    ext = p.get("externalIds") or {}
    arxiv = ext.get("ArXiv")
    return {
        "title": " ".join(p.get("title", "").split()),
        "year": p.get("year"),
        "citations": p.get("citationCount") or 0,
        "arxiv": arxiv,                 # arXiv id if available (clickable in-app)
        "id": arxiv or p.get("paperId", ""),
    }


def _edge_list(payload: Any, inner_key: str, limit: int) -> list[dict[str, Any]]:
    if not payload or "data" not in payload:
        return []
    out = []
    for item in payload["data"]:
        node = _node(item.get(inner_key) or {})
        if node:
            out.append(node)
    # Most-cited first, keep it readable.
    out.sort(key=lambda n: n["citations"], reverse=True)
    return out[:limit]


def references(arxiv_id: str, limit: int = 12) -> list[dict[str, Any]]:
    fields = "title,year,citationCount,externalIds"
    data = _get(
        f"{GRAPH}/paper/arXiv:{_bare(arxiv_id)}/references",
        {"fields": fields, "limit": 40},
    )
    return _edge_list(data, "citedPaper", limit)


def citations(arxiv_id: str, limit: int = 12) -> list[dict[str, Any]]:
    fields = "title,year,citationCount,externalIds"
    data = _get(
        f"{GRAPH}/paper/arXiv:{_bare(arxiv_id)}/citations",
        {"fields": fields, "limit": 40},
    )
    return _edge_list(data, "citingPaper", limit)


def recommendations(arxiv_id: str, limit: int = 8) -> list[dict[str, Any]]:
    fields = "title,year,citationCount,externalIds"
    data = _get(
        f"{REC}/papers/forpaper/arXiv:{_bare(arxiv_id)}",
        {"fields": fields, "limit": limit},
    )
    if not data or "recommendedPapers" not in data:
        return []
    out = [n for p in data["recommendedPapers"] if (n := _node(p))]
    return out[:limit]


def graph(arxiv_id: str) -> dict[str, Any]:
    """Citation map: what this paper builds on (references) and who builds on it."""
    refs = references(arxiv_id, limit=10)
    cites = citations(arxiv_id, limit=10)
    return {
        "available": bool(refs or cites),
        "references": refs,
        "citations": cites,
    }
