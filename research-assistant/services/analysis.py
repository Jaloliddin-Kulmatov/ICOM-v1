"""Feature logic: reviewer scorecard, weaknesses, beginner mode, reproduction,
multi-paper compare, gap finder, reviewer debate, and reading plans.

Each builder works from metadata + abstract, and can optionally fold in the full
PDF text (`full_text=...`) for a much deeper read — the edge over abstract-only
tools.
"""
from __future__ import annotations

from typing import Any

from . import llm

_REVIEWER_SYSTEM = (
    "You are an experienced program-committee reviewer for a top-tier ML/CS venue "
    "(NeurIPS/ICML/ACL caliber). You are rigorous, specific, and fair. When given "
    "only an abstract you flag judgments that would need the full paper; when given "
    "the full text you ground every claim in it."
)

_REVIEWER_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "summary": {"type": "string"},
        "scores": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "originality": {"type": "integer"},
                "methodology": {"type": "integer"},
                "clarity": {"type": "integer"},
                "significance": {"type": "integer"},
            },
            "required": ["originality", "methodology", "clarity", "significance"],
        },
        "overall": {"type": "integer"},
        "confidence": {"type": "integer"},
        "strengths": {"type": "array", "items": {"type": "string"}},
        "weaknesses": {"type": "array", "items": {"type": "string"}},
        "predicted_criticisms": {"type": "array", "items": {"type": "string"}},
        "suggested_experiments": {"type": "array", "items": {"type": "string"}},
        "acceptance": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "top_tier": {"type": "string"},
                "mid_tier": {"type": "string"},
                "workshop": {"type": "string"},
                "rationale": {"type": "string"},
            },
            "required": ["top_tier", "mid_tier", "workshop", "rationale"],
        },
    },
    "required": [
        "summary", "scores", "overall", "confidence", "strengths",
        "weaknesses", "predicted_criticisms", "suggested_experiments", "acceptance",
    ],
}


def _paper_block(paper: dict[str, Any], full_text: str | None = None) -> str:
    authors = ", ".join(paper.get("authors", [])) or "Unknown"
    cats = ", ".join(paper.get("categories", [])) or paper.get("primary_category", "")
    block = (
        f"Title: {paper.get('title', '')}\n"
        f"Authors: {authors}\n"
        f"Categories: {cats}\n"
        f"Published: {paper.get('published', '')}\n"
        f"Comments: {paper.get('comment', '') or 'none'}\n\n"
        f"Abstract:\n{paper.get('summary', '')}"
    )
    if full_text:
        block += (
            "\n\n=== FULL PAPER TEXT (extracted from PDF, may be truncated) ===\n"
            + full_text
        )
    return block


def review(paper: dict[str, Any], full_text: str | None = None) -> dict[str, Any]:
    depth = "You have the full paper text — ground your scores in the actual methods and results." \
        if full_text else "You have only the abstract — flag where a confident verdict needs the full paper."
    prompt = (
        "Act as a conference reviewer. Score originality, methodology, clarity, and "
        "significance 1-10, give an overall 1-10 and a 1-5 confidence, then list "
        "strengths, weaknesses, likely reviewer criticisms, strengthening experiments, "
        f"and per-tier acceptance likelihood. {depth} Be specific to THIS paper.\n\n"
        f"{_paper_block(paper, full_text)}"
    )
    return llm.complete_json(_REVIEWER_SYSTEM, prompt, _REVIEWER_SCHEMA)


def weaknesses(paper: dict[str, Any], full_text: str | None = None) -> str:
    system = "You are a meticulous methods reviewer. You surface concrete limitations, not generic ones."
    prompt = (
        "Produce a weakness report in Markdown:\n"
        "## Stated & likely limitations\n## Missing or weak experiments\n"
        "## Evaluation / dataset concerns (size, baselines, statistical rigor)\n"
        "## Threats to validity\n## Concrete suggestions to improve\n\n"
        "Bullet points. Be specific to this paper.\n\n"
        f"{_paper_block(paper, full_text)}"
    )
    return llm.complete(system, prompt)


def beginner(paper: dict[str, Any], full_text: str | None = None) -> str:
    system = "You are a patient teacher explaining research to an advanced undergraduate. Define every term."
    prompt = (
        "Explain this paper in beginner-friendly Markdown:\n"
        "## The problem in plain language\n## Key terms (define each)\n"
        "## The core idea / method, step by step\n## Why it matters\n"
        "## What to learn first (prerequisites)\n\n"
        "Use analogies and short sentences.\n\n"
        f"{_paper_block(paper, full_text)}"
    )
    return llm.complete(system, prompt)


def implementation(paper: dict[str, Any], full_text: str | None = None) -> str:
    system = "You are a senior ML engineer who helps people reproduce papers. Be practical and honest about gaps."
    prompt = (
        "Produce a reproduction guide in Markdown:\n"
        "## Reproduction checklist\n## Suggested project structure\n"
        "## Code skeleton (Python, with TODOs where underspecified)\n"
        "## Data & preprocessing notes\n## Likely pitfalls\n\n"
        "Keep code minimal but real. Mark assumptions clearly.\n\n"
        f"{_paper_block(paper, full_text)}"
    )
    return llm.complete(system, prompt)


def debate(paper: dict[str, Any], full_text: str | None = None) -> str:
    system = (
        "You simulate a realistic paper-review discussion among three distinct voices. "
        "Each has a different temperament; they genuinely disagree before converging."
    )
    prompt = (
        "Stage a review debate about the paper below, in Markdown:\n\n"
        "## ✅ Reviewer A — the champion\nArgue for acceptance. Strongest case, concrete merits.\n\n"
        "## ❌ Reviewer B — the skeptic\nArgue for rejection. Sharpest objections, what would sink it.\n\n"
        "## ↔ Rebuttals\nLet A and B respond to each other's strongest point (2-3 exchanges).\n\n"
        "## ⚖️ Meta-reviewer — the verdict\nWeigh both sides, give a decision "
        "(accept / borderline / reject), and the single most important thing the "
        "authors should do next.\n\n"
        "Keep each voice in character and specific to this paper.\n\n"
        f"{_paper_block(paper, full_text)}"
    )
    return llm.complete(system, prompt, max_tokens=18000)


def gaps(papers: list[dict[str, Any]], topic: str = "") -> str:
    system = "You are a research advisor who helps students find thesis topics by spotting what a body of work hasn't addressed."
    blocks = "\n\n---\n\n".join(_paper_block(p) for p in papers)
    header = f"Topic focus: {topic}\n\n" if topic else ""
    prompt = (
        "From the papers below, identify research gaps in Markdown:\n"
        "## What is well covered\n## Underexplored questions\n"
        "## Missing datasets / benchmarks\n## Underexplored populations, settings, or methods\n"
        "## 3-5 concrete thesis-sized project ideas\n\n"
        f"{header}{blocks}"
    )
    return llm.complete(system, prompt, max_tokens=20000)


def compare(papers: list[dict[str, Any]]) -> str:
    system = "You are a literature-review expert. You compare papers precisely — agreements, disagreements, lineage."
    blocks = "\n\n---\n\n".join(f"[Paper {i + 1}]\n{_paper_block(p)}" for i, p in enumerate(papers))
    prompt = (
        "Compare the papers below in Markdown:\n"
        "## At-a-glance comparison table\n(columns: Paper, Core idea, Method, Data/eval, Key claim)\n"
        "## Agreements\n## Disagreements / tensions\n"
        "## How they relate (who builds on whom, evolution of ideas)\n"
        "## Which to read first and why\n\n"
        f"{blocks}"
    )
    return llm.complete(system, prompt, max_tokens=20000)


def reading_plan(papers: list[dict[str, Any]]) -> str:
    system = "You are a study coach who turns a pile of papers into an ordered, achievable reading plan."
    blocks = "\n\n---\n\n".join(f"[Paper {i + 1}]\n{_paper_block(p)}" for i, p in enumerate(papers))
    prompt = (
        "Build a reading plan in Markdown for the papers below:\n"
        "## Difficulty & time estimate\nA table: Paper | Difficulty (1-5) | Est. read time | Prerequisites.\n"
        "## Recommended order\nNumbered, with one line on why each comes when it does.\n"
        "## Prerequisite concepts to review first\n"
        "## A one-week schedule\nSplit the reading across 7 days realistically.\n\n"
        f"{blocks}"
    )
    return llm.complete(system, prompt, max_tokens=18000)
