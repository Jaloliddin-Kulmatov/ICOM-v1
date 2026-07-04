"""Paper discovery via the arXiv API (free, no key required).

arXiv exposes an Atom feed at export.arxiv.org/api/query. We normalize each
entry into a plain dict the rest of the app can rely on.
"""
from __future__ import annotations

import time
from typing import Any

import feedparser
import requests

ARXIV_API = "http://export.arxiv.org/api/query"
_USER_AGENT = "research-assistant/1.0 (https://example.local; mailto:dev@example.local)"

_CACHE: dict[str, tuple[float, Any]] = {}
_CACHE_TTL = 600  # seconds


def _cache_get(key: str) -> Any | None:
    hit = _CACHE.get(key)
    if not hit:
        return None
    ts, payload = hit
    if time.time() - ts > _CACHE_TTL:
        _CACHE.pop(key, None)
        return None
    return payload


def _cache_put(key: str, payload: Any) -> None:
    _CACHE[key] = (time.time(), payload)


def _normalize(entry: Any) -> dict[str, Any]:
    arxiv_id = entry.get("id", "")
    short_id = arxiv_id.rsplit("/abs/", 1)[-1] if "/abs/" in arxiv_id else arxiv_id

    pdf_url = ""
    abs_url = arxiv_id
    for link in entry.get("links", []):
        if link.get("type") == "application/pdf":
            pdf_url = link.get("href", "")
        elif link.get("rel") == "alternate":
            abs_url = link.get("href", abs_url)
    if not pdf_url and short_id:
        pdf_url = f"https://arxiv.org/pdf/{short_id}"

    authors = [a.get("name", "") for a in entry.get("authors", []) if a.get("name")]
    categories = [t.get("term", "") for t in entry.get("tags", []) if t.get("term")]

    return {
        "id": short_id,
        "title": " ".join(entry.get("title", "").split()),
        "summary": " ".join(entry.get("summary", "").split()),
        "authors": authors,
        "published": entry.get("published", ""),
        "updated": entry.get("updated", ""),
        "pdf_url": pdf_url,
        "abs_url": abs_url,
        "categories": categories,
        "primary_category": (entry.get("arxiv_primary_category") or {}).get("term", ""),
        "comment": entry.get("arxiv_comment", ""),
    }


def _query(params: dict[str, Any]) -> list[dict[str, Any]]:
    key = repr(sorted(params.items()))
    cached = _cache_get(key)
    if cached is not None:
        return cached
    resp = requests.get(
        ARXIV_API, params=params, headers={"User-Agent": _USER_AGENT}, timeout=20
    )
    resp.raise_for_status()
    feed = feedparser.parse(resp.content)
    papers = [_normalize(e) for e in feed.entries]
    _cache_put(key, papers)
    return papers


def search(query: str, max_results: int = 12, sort: str = "relevance") -> list[dict[str, Any]]:
    query = (query or "").strip()
    if not query:
        return []
    sort_by = sort if sort in {"relevance", "lastUpdatedDate", "submittedDate"} else "relevance"
    return _query(
        {
            "search_query": f"all:{query}",
            "start": 0,
            "max_results": max(1, min(max_results, 50)),
            "sortBy": sort_by,
            "sortOrder": "descending",
        }
    )


def get_by_id(arxiv_id: str) -> dict[str, Any] | None:
    arxiv_id = (arxiv_id or "").strip()
    if not arxiv_id:
        return None
    papers = _query({"id_list": arxiv_id, "max_results": 1})
    return papers[0] if papers else None


def get_many(arxiv_ids: list[str]) -> list[dict[str, Any]]:
    ids = [i.strip() for i in arxiv_ids if i and i.strip()]
    if not ids:
        return []
    papers = _query({"id_list": ",".join(ids), "max_results": len(ids)})
    by_id = {p["id"]: p for p in papers}
    ordered: list[dict[str, Any]] = []
    for raw in ids:
        base = raw.split("v")[0]
        match = by_id.get(raw) or next(
            (p for p in papers if p["id"].split("v")[0] == base), None
        )
        if match:
            ordered.append(match)
    return ordered
