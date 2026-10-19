"""The AI keeps working when Groq retires a model; users never see raw errors."""
from types import SimpleNamespace

import pytest

import groq_models


class FakeGroq:
    """Behaves like Groq: retired models raise model_not_found."""
    def __init__(self, available, listed=None, other_error=None):
        self.available, self.calls, self.other_error = set(available), [], other_error
        self.listed = listed if listed is not None else list(available)
        outer = self

        class _Completions:
            @staticmethod
            def create(model, messages, **kw):
                outer.calls.append((model, kw))
                if outer.other_error:
                    raise RuntimeError(outer.other_error)
                if model not in outer.available:
                    raise RuntimeError(f"Error code: 404 - model `{model}` does not exist (model_not_found)")
                return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=f"answer from {model}"))])
        self.chat = SimpleNamespace(completions=_Completions())
        self.models = SimpleNamespace(list=lambda: SimpleNamespace(data=[SimpleNamespace(id=i) for i in outer.listed]))


@pytest.fixture(autouse=True)
def fresh(monkeypatch):
    monkeypatch.delenv("GROQ_MODEL", raising=False)
    groq_models._working["model"] = None
    yield
    groq_models._working["model"] = None


def test_default_model_and_reasoning_setting():
    g = FakeGroq(["openai/gpt-oss-120b"])
    r = groq_models.complete(g, [{"role": "user", "content": "hi"}], max_tokens=10)
    assert r.choices[0].message.content == "answer from openai/gpt-oss-120b"
    assert g.calls[0][1]["extra_body"] == {"reasoning_effort": "low"}


def test_falls_back_when_configured_model_is_retired(monkeypatch):
    monkeypatch.setenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    g = FakeGroq(["llama-3.1-8b-instant"])
    r = groq_models.complete(g, [])
    assert r.choices[0].message.content == "answer from llama-3.1-8b-instant"
    assert "extra_body" not in g.calls[-1][1]
    assert groq_models.current_model() == "llama-3.1-8b-instant"   # remembered
    g.calls.clear()
    groq_models.complete(g, [])
    assert [c[0] for c in g.calls] == ["llama-3.1-8b-instant"]      # no retries next time


def test_uses_groq_model_list_when_all_known_names_are_gone():
    g = FakeGroq(["meta-llama/llama-4-scout"], listed=["whisper-large-v3", "meta-llama/llama-4-scout", "llama-guard-4"])
    assert groq_models.complete(g, []).choices[0].message.content == "answer from meta-llama/llama-4-scout"


def test_other_errors_are_not_retried_on_other_models():
    g = FakeGroq(["openai/gpt-oss-120b"], other_error="rate limit exceeded")
    with pytest.raises(groq_models.AIUnavailable):
        groq_models.complete(g, [])
    assert len(g.calls) == 1


def test_chat_shows_a_friendly_error(client, monkeypatch):
    from routes import ai
    monkeypatch.setattr(ai, "_get_client", lambda: FakeGroq([], listed=[]))
    r = client.post("/api/ai/chat", json={"message": "hi"})
    assert r.status_code == 502
    assert r.get_json()["error"] == ai.AI_DOWN and "Groq" not in r.get_json()["error"]
