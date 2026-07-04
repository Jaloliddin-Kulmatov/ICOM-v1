# Lens — a research workbench for students

A Flask web app that turns arXiv into an AI research workbench built for
university students. Search papers, open any one into a **workspace** (credibility
score, interactive citation map, related work, and Claude reading the **full PDF**
to review / critique / explain / reproduce / *debate* it) — and **publish your own
research** to a community feed, with an optional AI pre-submission review.

Self-contained product living alongside the ICOM project — nothing here touches
the ICOM app.

## For students

- **Publish your research** — a submission form (title, authors, university,
  field, abstract, keywords, PDF upload *or* link, license) → appears in a
  browsable **Community** feed with a STUDENT badge.
- **AI pre-submission review** — get a reviewer scorecard on your *draft* before
  you publish, so you can improve it first.
- **Full workspace on your own paper** — credibility signals, and the same AI
  analysis (review, weaknesses, beginner, reproduce, debate) reading your uploaded
  PDF.
- **Beginner mode, reading plans, reviewer scorecards** across the literature.

## What makes it different from Elicit / Consensus / SciSpace

| | Lens |
|---|---|
| **Reviewer scorecard** | Simulates a conference reviewer: 4-axis scores, acceptance odds per venue tier, predicted reviewer criticisms — not just a summary. |
| **Full-PDF reading** | AI features read the entire paper PDF, not just the abstract (flip the "Full PDF" switch). |
| **Citation map** | Interactive graph of what a paper builds on and who builds on it — click a node to jump there. |
| **Credibility score** | Transparent 0–100 from real signals (citations, influential citations, velocity, venue, code, reproducibility, collaboration, freshness). Every point is attributed. |
| **Reviewer debate** | Two AI reviewers argue accept vs reject; a meta-reviewer decides. |
| **Local-first** | No login, no tracking. Search, maps, scores, and exports are free and work with no API key. |

## Features

| Works with **no key** | Needs `ANTHROPIC_API_KEY` |
|---|---|
| arXiv search (relevance / newest / updated) | Reviewer scorecard |
| Paper workspace + citation map | Weakness report |
| Credibility score + breakdown | Beginner explanation |
| Related work (Semantic Scholar) | Reproduction guide |
| Save to library (SQLite) | Reviewer debate |
| **Publish research + Community feed** | **AI pre-submission review** |
| **PDF upload (25 MB) + serving** | Compare / gaps / reading plan (across selected papers) |
| Export any result as Markdown | |

Every AI result is cached in SQLite (instant + free re-open); ↻ regenerates,
and there's a separate cache for full-PDF vs abstract runs.

## Setup

```bash
cd research-assistant
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # add ANTHROPIC_API_KEY for the AI features
python app.py               # → http://127.0.0.1:5057
```

The status pill (bottom-left) shows whether AI is on. Everything else works
without a key. Model defaults to `claude-opus-4-8` (override with `RA_MODEL`).

## Architecture

```
app.py                 Flask routes + JSON API
services/
  sources.py           arXiv fetch + normalize + TTL cache
  scholar.py           Semantic Scholar (citations, refs, related) — throttled + backoff
  credibility.py       transparent 0–100 score from real signals
  pdf.py               arXiv PDF → text (full-paper analysis)
  llm.py               Anthropic SDK wrapper (text + schema-constrained JSON)
  analysis.py          prompts: review, weaknesses, beginner, reproduce, debate, compare, gaps, plan
  store.py             SQLite: saved library + analysis cache
templates/index.html   single-page UI (Discover / Library + workspace drawer)
static/style.css       editorial dark theme
static/app.js          frontend logic (vanilla JS)
research.db            SQLite, created on first run (gitignored)
```

### API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | `{ ok, ai_enabled, model }` |
| GET | `/api/search?q=&sort=&limit=` | arXiv results (`saved` flag) |
| GET | `/api/details/<id>` | scholar enrichment + credibility (no key) |
| GET | `/api/graph/<id>` | citation map: references + citations (no key) |
| GET | `/api/related/<id>` | recommended papers (no key) |
| POST | `/api/review` | `{ id, fulltext?, fresh? }` → scorecard |
| POST | `/api/analyze` | `{ id, kind, fulltext?, fresh? }` → markdown (`kind`: weaknesses/beginner/implementation/debate) |
| POST | `/api/compare` | `{ ids }` |
| POST | `/api/gaps` | `{ ids, topic? }` |
| POST | `/api/reading-plan` | `{ ids }` |
| GET/POST | `/api/library` · `/api/library/toggle` | saved papers |
| GET | `/api/community?q=&field=` | student-published papers |
| POST | `/api/publish` | multipart: title, authors, university, field, abstract, keywords, contact, license, `pdf` file **or** `link` |
| POST | `/api/prereview` | `{ title, abstract, authors?, field? }` → scorecard on a draft |
| GET | `/uploads/<file>` | serves uploaded PDFs |

Community papers get ids like `lens-<hex>` and flow through the same workspace,
credibility, and AI analysis as arXiv papers (citation maps are skipped — they're
not indexed yet).

## Notes

- Semantic Scholar's free pool rate-limits aggressively; `scholar.py` self-throttles
  to ~1 req/sec with exponential backoff and caches for 30 min. On a miss the UI
  degrades gracefully (score falls back to metadata-only, map shows a retry note).
- Full-PDF extraction caps at 30 pages / ~48k chars to bound token cost; scanned
  (image-only) PDFs won't extract.
