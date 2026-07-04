"""Thin wrapper around the Anthropic SDK.

`complete()` -> text/markdown, `complete_json()` -> schema-validated dict. If no
key is configured the app still runs (search, citation maps, credibility,
exports all work); the AI features raise LLMUnavailable, which routes turn into a
friendly message.
"""
from __future__ import annotations

import os
from typing import Any

try:
    import anthropic
except ImportError:  # pragma: no cover
    anthropic = None  # type: ignore

MODEL = os.environ.get("RA_MODEL", "claude-opus-4-8")

_client: Any = None


class LLMUnavailable(RuntimeError):
    pass


def available() -> bool:
    return bool(anthropic) and bool(os.environ.get("ANTHROPIC_API_KEY"))


def _get_client() -> Any:
    global _client
    if not anthropic:
        raise LLMUnavailable("The 'anthropic' package isn't installed. Run: pip install -r requirements.txt")
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise LLMUnavailable("ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.")
    if _client is None:
        _client = anthropic.Anthropic()
    return _client


def _to_error(exc: Exception) -> LLMUnavailable:
    if anthropic and isinstance(exc, anthropic.APIStatusError):
        return LLMUnavailable(f"Claude API error {exc.status_code}: {exc.message}")
    if anthropic and isinstance(exc, anthropic.APIConnectionError):
        return LLMUnavailable("Couldn't reach the Claude API (network error).")
    return LLMUnavailable(str(exc))


def complete(system: str, prompt: str, max_tokens: int = 16000) -> str:
    client = _get_client()
    try:
        resp = client.messages.create(
            model=MODEL,
            max_tokens=max_tokens,
            thinking={"type": "adaptive"},
            system=system,
            messages=[{"role": "user", "content": prompt}],
        )
    except LLMUnavailable:
        raise
    except Exception as exc:  # noqa: BLE001
        raise _to_error(exc) from exc
    return "".join(b.text for b in resp.content if getattr(b, "type", "") == "text").strip()


def complete_json(system: str, prompt: str, schema: dict[str, Any], max_tokens: int = 16000) -> dict[str, Any]:
    client = _get_client()
    try:
        resp = client.messages.create(
            model=MODEL,
            max_tokens=max_tokens,
            thinking={"type": "adaptive"},
            system=system,
            messages=[{"role": "user", "content": prompt}],
            output_config={"format": {"type": "json_schema", "schema": schema}},
        )
    except LLMUnavailable:
        raise
    except Exception as exc:  # noqa: BLE001
        raise _to_error(exc) from exc

    import json

    text = "".join(b.text for b in resp.content if getattr(b, "type", "") == "text").strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise LLMUnavailable("The model returned malformed JSON.") from exc
