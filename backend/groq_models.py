"""One place that picks the Groq model, and survives Groq retiring it.

Groq retired llama-3.3-70b-versatile on 16 Aug 2026 and every AI feature
broke. Now: use GROQ_MODEL if set, else DEFAULT_MODEL. If Groq answers
"model not found / decommissioned", try the FALLBACKS, then whatever chat
model the account can actually use (from Groq's model list). The model that
worked is remembered until the server restarts.
"""
import os
import threading

DEFAULT_MODEL = "openai/gpt-oss-120b"          # Groq's recommended replacement (production tier)
FALLBACKS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.1-8b-instant"]
# Preferred families when picking from Groq's live model list, best first.
PREFERENCE = ["gpt-oss-120b", "gpt-oss-20b", "llama-4", "llama-3", "qwen", "kimi", "gemma"]
_NOT_CHAT = ("whisper", "tts", "guard", "prompt-guard", "embed", "orpheus", "distil")

_working = {"model": None}
_lock = threading.Lock()


class AIUnavailable(Exception):
    """No Groq model could answer. The message is safe to log, not to show."""


def configured_model() -> str:
    return (os.environ.get("GROQ_MODEL") or "").strip() or DEFAULT_MODEL


def current_model() -> str:
    return _working["model"] or configured_model()


def _is_missing_model(err: Exception) -> bool:
    text = str(err).lower()
    return any(s in text for s in ("model_not_found", "does not exist", "decommissioned", "model_decommissioned"))


def _extra(model: str) -> dict:
    # gpt-oss models think before answering; keep that short so the reply
    # fits in max_tokens and comes back fast.
    return {"extra_body": {"reasoning_effort": "low"}} if "gpt-oss" in model else {}


def _live_candidates(client) -> list[str]:
    try:
        ids = [m.id for m in client.models.list().data]
    except Exception:
        return []
    chat = [i for i in ids if not any(x in i.lower() for x in _NOT_CHAT)]
    return sorted(chat, key=lambda i: next((n for n, p in enumerate(PREFERENCE) if p in i.lower()), len(PREFERENCE)))


def complete(client, messages, **kwargs):
    """client.chat.completions.create with automatic model fallback."""
    tried, last = [], None
    candidates = [current_model()] + [m for m in FALLBACKS]
    i = 0
    while i < len(candidates):
        model = candidates[i]
        i += 1
        if model in tried:
            continue
        tried.append(model)
        try:
            resp = client.chat.completions.create(model=model, messages=messages, **_extra(model), **kwargs)
        except Exception as e:  # noqa: BLE001 — Groq SDK raises several error types
            last = e
            if not _is_missing_model(e):
                raise AIUnavailable(f"{model}: {e}") from e
            print(f"[groq] model {model} unavailable, trying another")
            if i == len(candidates):   # out of known names: ask Groq what exists
                candidates += [m for m in _live_candidates(client) if m not in tried]
            continue
        with _lock:
            if _working["model"] != model:
                print(f"[groq] using model {model}")
                _working["model"] = model
        return resp
    raise AIUnavailable(f"no Groq model available (tried {', '.join(tried)}): {last}")
