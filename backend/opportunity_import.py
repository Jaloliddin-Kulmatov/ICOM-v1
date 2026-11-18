"""Daily import of scholarships, contests and programs from other websites.

Sources (both allow crawlers in robots.txt; we identify ourselves and go slowly):
  * Scholarships Corner  - its public WordPress API, posts that mention Korea
  * Wevity (위비티)       - Korean contest site, searched for 외국인 / 유학생

The AI reads each candidate, keeps only what international students in Korea
can apply for, and writes an English title and a short summary (we never copy
whole posts; every item links to its source). Imported items wait in the admin
review queue (review_status="pending") like the ones students share, so nothing
reaches the site or the social posts without an admin's OK.
"""
import html
import json
import re
import time
from datetime import date, datetime, timedelta

import requests

from app import db
from job_lifecycle import kst_today
from models import Job

UA = "Mozilla/5.0 (compatible; ICOM-bot/1.0; +https://icom.ai.kr)"
PER_SOURCE = 15          # candidates read per source per run
PAUSE = 1.0              # seconds between page requests, to be polite
KINDS = ("scholarship", "contest", "program", "internship")


def _text(fragment: str) -> str:
    t = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", fragment or "", flags=re.S | re.I)
    t = re.sub(r"<[^>]+>", " ", t)
    return re.sub(r"\s+", " ", html.unescape(t)).strip()


# ── Scholarships Corner ──────────────────────────────────────────────────────

SC_API = "https://scholarshipscorner.website/wp-json/wp/v2/posts"


def fetch_scholarships_corner(session) -> list:
    after = (datetime.utcnow() - timedelta(days=60)).strftime("%Y-%m-%dT00:00:00")
    r = session.get(SC_API, timeout=30, params={
        "search": "korea", "per_page": PER_SOURCE, "after": after,
        "_fields": "id,date,link,title,content"})
    r.raise_for_status()
    out = []
    for p in r.json():
        title = _text(p.get("title", {}).get("rendered", ""))
        body = p.get("content", {}).get("rendered", "")
        if "korea" not in title.lower():     # "Korea" only in an eligible-countries list doesn't count
            continue
        # The organizer's own page, when the post links to one ("Apply now", "Official website").
        official = ""
        for href, label in re.findall(r'<a[^>]+href="(https?://[^"]+)"[^>]*>(.*?)</a>', body, flags=re.S | re.I):
            if "scholarshipscorner" not in href and re.search(r"apply|official|website", _text(label), re.I):
                official = href
                break
        out.append({"source": "Scholarships Corner", "source_url": p["link"], "title": title,
                    "organizer": "", "deadline": "", "amount": "", "eligibility": "",
                    "apply_link": official or p["link"], "text": _text(body)[:4000], "kind_hint": ""})
    return out


# ── Wevity (위비티) ───────────────────────────────────────────────────────────

WEVITY = "https://www.wevity.com/"
WEVITY_SEARCH = ("외국인", "유학생")


def _wevity_field(page: str, label: str) -> str:
    m = re.search(rf'<span class="tit">{label}</span>(.*?)</li>', page, flags=re.S)
    return _text(m.group(1)) if m else ""


def fetch_wevity(session) -> list:
    ids = []
    for word in WEVITY_SEARCH:
        r = session.get(WEVITY, timeout=30, params={"c": "find", "s": "1", "sw": word})
        r.raise_for_status()
        for ix in re.findall(r"gbn=view&(?:amp;)?gp=1&(?:amp;)?ix=(\d+)", r.text):
            if ix not in ids:
                ids.append(ix)
        time.sleep(PAUSE)
    out = []
    for ix in ids[:PER_SOURCE]:
        url = f"{WEVITY}?c=find&s=1&gub=1&gbn=view&gp=1&ix={ix}"
        if Job.query.filter_by(source_url=url).first():
            continue                                   # already imported: don't fetch it again
        page = session.get(url, timeout=30).text
        time.sleep(PAUSE)
        title_m = re.search(r'<h6 class="tit">(.*?)</h6>', page, flags=re.S) or re.search(r"<title>(.*?)</title>", page, flags=re.S)
        period = _wevity_field(page, "접수기간")
        dates = re.findall(r"\d{4}-\d{2}-\d{2}", period)
        site = re.search(r'<span class="tit">홈페이지</span>\s*<a href="(https?://[^"]+)"', page)
        body = re.search(r'id="viewContents">(.*?)<div class="(?:article|comm-btn)', page, flags=re.S)
        out.append({"source": "Wevity", "source_url": url,
                    "title": _text(title_m.group(1)) if title_m else "",
                    "organizer": _wevity_field(page, "주최/주관"), "deadline": dates[-1] if dates else "",
                    "amount": _wevity_field(page, "총 상금"), "eligibility": _wevity_field(page, "응모대상"),
                    "apply_link": site.group(1) if site else url,
                    "text": _text(body.group(1) if body else page)[:4000], "kind_hint": "contest"})
    return out


SOURCES = {"scholarships_corner": fetch_scholarships_corner, "wevity": fetch_wevity}


# ── AI: is it for international students, and what is it? ───────────────────

PROMPT = """You help international students in Korea (mostly D-2/D-4 visa university students from Asia) find opportunities.
Read the post and answer with ONLY a JSON object:
{"relevant": true/false,   // true only if it takes place in Korea (or online from Korea) AND an international student currently studying in Korea can apply. false if it needs Korean citizenship, is only for people abroad applying to come to Korea, takes place in another country, or is not an opportunity (news, guides, ads)
 "kind": "scholarship" | "contest" | "program" | "internship",
 "title": "short English title",
 "organizer": "who offers it, in English",
 "deadline": "YYYY-MM-DD or empty",
 "amount": "money, prize or support in a few words, in English, or empty",
 "eligibility": "who can apply, in a few English words",
 "summary": "2 short English sentences: what it is and what you get. Use only facts in the post."}"""


def enrich(client, cand: dict) -> dict | None:
    from groq_models import complete
    post = "\n".join(f"{k}: {cand[k]}" for k in ("title", "organizer", "deadline", "amount", "eligibility") if cand.get(k))
    resp = complete(client, [
        {"role": "system", "content": PROMPT},
        {"role": "user", "content": f"Source: {cand['source']}\n{post}\n\nPost text:\n{cand['text']}"},
    ], temperature=0.1, max_tokens=600)
    raw = resp.choices[0].message.content or ""
    m = re.search(r"\{.*\}", raw, flags=re.S)
    data = json.loads(m.group(0) if m else raw)
    return data if isinstance(data, dict) else None


def enrich_with_retry(client, cand: dict, tries: int = 3) -> dict | None:
    """The free AI plan allows only so much per minute; when a long list hits that, wait and try again."""
    for attempt in range(tries):
        try:
            return enrich(client, cand)
        except Exception as e:
            if attempt == tries - 1:
                raise
            print(f"[import] AI busy ({str(e)[:80]}), retrying")
            time.sleep(8 * (attempt + 1) ** 2)      # 8 s, then 32 s


# Used when the AI couldn't answer: the commonest words for each kind.
_KIND_WORDS = (
    ("internship", r"\bintern(ship)?s?\b|인턴"),
    ("contest", r"contest|competition|award|hackathon|challenge|prize|공모전|대회"),
    ("scholarship", r"scholarship|grant|tuition|bursary|장학"),
    ("program", r"fellowship|program|programme|summer school|winter school|camp|conference|summit|forum|workshop|residency|exchange|call for papers"),
)


def guess_kind(text: str, fallback: str = "program") -> str:
    low = (text or "").lower()
    for kind, pattern in _KIND_WORDS:
        if re.search(pattern, low):
            return kind
    return fallback


def _deadline_ok(d: str) -> bool:
    try:
        return date.fromisoformat(d[:10]) >= kst_today()
    except ValueError:
        return True          # no or unreadable deadline: keep it, the admin decides


def _save(cand: dict, info: dict) -> Job:
    kind = info.get("kind") if info.get("kind") in KINDS else (
        cand.get("kind_hint") or guess_kind(f"{cand.get('title', '')} {cand.get('text', '')[:1500]}"))
    deadline = (info.get("deadline") or cand.get("deadline") or "").strip()[:10]
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", deadline):
        deadline = ""
    eligibility = (info.get("eligibility") or "").strip()
    desc = "\n\n".join(x for x in (
        (info.get("summary") or "").strip(),
        f"Who can apply: {eligibility}" if eligibility else "",
        f"Found on {cand['source']}: {cand['source_url']}",
    ) if x)
    job = Job(
        title=(info.get("title") or cand["title"]).strip()[:200], company=(info.get("organizer") or cand["organizer"] or cand["source"]).strip()[:150],
        location="", job_type=kind, salary=(info.get("amount") or "").strip()[:100], description=desc,
        deadline=deadline, visa_compatible="D-2, D-4", apply_link=cand["apply_link"][:500],
        tags=f"{kind.title()}, via {cand['source']}", source_url=cand["source_url"][:500],
        created_by=None, is_active=False, review_status="pending",
    )
    db.session.add(job)
    return job


def run(sources=None) -> dict:
    """Import new candidates from every source into the review queue."""
    from routes.ai import _get_client
    client = _get_client()
    if client is None:
        return {"status": "no_ai", "message": "GROQ_API_KEY isn't set, so ICOM can't check and translate posts."}
    session = requests.Session()
    session.headers["User-Agent"] = UA
    result = {"status": "done", "added": 0, "skipped": 0, "errors": []}
    for name in sources or SOURCES:
        try:
            cands = SOURCES[name](session)
        except Exception as e:     # one broken site never stops the others
            result["errors"].append(f"{name}: {str(e)[:120]}")
            continue
        for cand in cands:
            if not cand["title"] or Job.query.filter_by(source_url=cand["source_url"]).first():
                result["skipped"] += 1
                continue
            try:
                info = enrich_with_retry(client, cand)
            except Exception as e:
                result["errors"].append(f"{name}: AI: {str(e)[:80]}")
                continue
            if not info or not info.get("relevant") or not _deadline_ok(info.get("deadline") or cand["deadline"]):
                result["skipped"] += 1
                # remember it so we don't ask the AI again tomorrow
                db.session.add(Job(title=cand["title"][:200], company=cand["source"], job_type="skipped",
                                   source_url=cand["source_url"][:500], is_active=False, review_status="rejected",
                                   closed_at=datetime.utcnow()))   # purged after 30 days, then checked again
                continue
            _save(cand, info)
            result["added"] += 1
        db.session.commit()
    return result


def run_scheduled(flask_app) -> None:
    with flask_app.app_context():
        try:
            print(f"[import] {run()}")
        except Exception as e:
            db.session.rollback()
            print(f"[import] failed: {e}")
