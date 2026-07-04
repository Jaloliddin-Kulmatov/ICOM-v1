"""Fetch and extract text from an arXiv PDF.

Used to give the AI features the full paper instead of just the abstract — the
main edge over abstract-only tools. Text is capped (pages + chars) to keep token
use bounded, and cached in-process so re-analysis is instant.
"""
from __future__ import annotations

import io
import os
import time
from typing import Any

import requests

try:
    from pypdf import PdfReader
except ImportError:  # pragma: no cover
    PdfReader = None  # type: ignore

MAX_PAGES = 30
MAX_CHARS = 48000
_HEADERS = {"User-Agent": "research-assistant/1.0"}

_CACHE: dict[str, tuple[float, str]] = {}
_CACHE_TTL = 3600


class PdfError(RuntimeError):
    pass


def fetch_text(source: str) -> str:
    """Extract text from a PDF given either an http(s) URL or a local file path."""
    if not PdfReader:
        raise PdfError("pypdf isn't installed. Run: pip install -r requirements.txt")
    if not source:
        raise PdfError("No PDF available for this paper.")

    hit = _CACHE.get(source)
    if hit and time.time() - hit[0] < _CACHE_TTL:
        return hit[1]

    is_url = source.startswith("http://") or source.startswith("https://")
    if is_url:
        try:
            resp = requests.get(source, headers=_HEADERS, timeout=40)
            resp.raise_for_status()
            raw = resp.content
        except requests.RequestException as exc:
            raise PdfError(f"Couldn't download the PDF: {exc}") from exc
    else:
        if not os.path.isfile(source):
            raise PdfError("The uploaded PDF could not be found on disk.")
        with open(source, "rb") as fh:
            raw = fh.read()

    try:
        reader = PdfReader(io.BytesIO(raw))
    except Exception as exc:  # noqa: BLE001
        raise PdfError(f"Couldn't parse the PDF: {exc}") from exc

    parts: list[str] = []
    total = 0
    for page in reader.pages[:MAX_PAGES]:
        try:
            txt = page.extract_text() or ""
        except Exception:  # noqa: BLE001
            txt = ""
        if not txt:
            continue
        parts.append(txt)
        total += len(txt)
        if total >= MAX_CHARS:
            break

    text = "\n".join(parts).strip()
    if len(text) > MAX_CHARS:
        text = text[:MAX_CHARS] + "\n…[truncated]"
    if not text:
        raise PdfError("No extractable text in this PDF (it may be scanned images).")

    _CACHE[source] = (time.time(), text)
    return text


def info(text: str) -> dict[str, Any]:
    return {"chars": len(text), "truncated": text.endswith("[truncated]")}
