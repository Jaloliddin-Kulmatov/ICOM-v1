"""Build backend/data/guides.json from the website's guide pages, so the AI
assistant can answer from ICOM's own guides and say which one it used.

    python build_guide_index.py      # run after editing any src/app/guide page

Pulls the readable text (questions, answers, paragraphs, list items) out of
each page's source. tests/test_web_features.py fails if the file is stale.

Each guide also gets an "updated" date: kept while its text is unchanged,
set to today (Korea time) when the text changes. The dates are copied to
src/lib/guide-dates.json for the "Updated …" line on each guide page.
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GUIDE_DIR = os.path.join(ROOT, "src", "app", "guide")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "guides.json")
DATES_OUT = os.path.join(ROOT, "src", "lib", "guide-dates.json")

TITLES = {
    "visa": "Visa & Immigration", "housing": "Housing", "banking": "Banking",
    "insurance": "Health Insurance", "transport": "Transport", "language": "Korean Language",
    "living": "Daily Life", "faq": "FAQ",
}

_STRING = re.compile(r'"((?:[^"\\]|\\.){25,})"|`([^`$]{25,})`')
_JSX_TEXT = re.compile(r">\s*([^<>{}\n][^<>{}]{24,}?)\s*<")
_CODE_LIKE = re.compile(r"^[\w\-/.:]+$|className|https?://|\bimport\b|\bconst\b|=>|[{};<>=]|rgba?\(|\.(tsx?|svg|png)\b")


def _clean(t: str) -> str:
    t = t.replace('\\"', '"').replace("\\n", " ")
    t = re.sub(r"&apos;", "'", t)
    t = re.sub(r"&quot;", '"', t)
    t = re.sub(r"&amp;", "&", t)
    return re.sub(r"\s+", " ", t).strip()


def extract(source: str) -> list[str]:
    texts = []
    for m in _STRING.finditer(source):
        texts.append(m.group(1) or m.group(2))
    texts += _JSX_TEXT.findall(source)
    out, seen = [], set()
    for t in map(_clean, texts):
        if len(t) < 25 or _CODE_LIKE.search(t) or t.count(" ") < 3 or t in seen:
            continue
        seen.add(t)
        out.append(t)
    return out


def _previous() -> dict:
    try:
        with open(OUT, encoding="utf-8") as f:
            return {g["slug"]: g for g in json.load(f)}
    except (OSError, ValueError):
        return {}


def _today_kst() -> str:
    from datetime import datetime, timedelta, timezone
    return datetime.now(timezone(timedelta(hours=9))).date().isoformat()


def build() -> list[dict]:
    previous = _previous()
    guides = []
    for slug in sorted(os.listdir(GUIDE_DIR)):
        page = os.path.join(GUIDE_DIR, slug, "page.tsx")
        if not os.path.isfile(page):
            continue
        with open(page, encoding="utf-8") as f:
            texts = extract(f.read())
        # Chunks of a few related sentences, which is what retrieval returns.
        chunks, cur = [], ""
        for t in texts:
            if len(cur) + len(t) > 700 and cur:
                chunks.append(cur)
                cur = ""
            cur = f"{cur} {t}".strip()
        if cur:
            chunks.append(cur)
        old = previous.get(slug)
        updated = old["updated"] if old and old.get("chunks") == chunks and old.get("updated") else _today_kst()
        guides.append({"slug": slug, "title": TITLES.get(slug, slug.title()),
                       "url": f"/guide/{slug}", "updated": updated, "chunks": chunks})
    return guides


if __name__ == "__main__":
    data = build()
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    with open(DATES_OUT, "w", encoding="utf-8") as f:
        json.dump({g["slug"]: g["updated"] for g in data}, f, indent=1)
        f.write("\n")
    print(f"Wrote {OUT}: " + ", ".join(f"{g['slug']} ({len(g['chunks'])} chunks)" for g in data))
