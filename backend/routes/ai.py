from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
import os

from app import db
from models import User, AISession, Job, Club

ai_bp = Blueprint("ai", __name__)

# Which Groq model to use (and what to do when Groq retires one): groq_models.py.
# Set GROQ_MODEL on the server to choose a different one.
from groq_models import complete, current_model, AIUnavailable

AI_DOWN = "The AI assistant isn't available right now. Please try again in a few minutes."

SYSTEM_PROMPT = """You are ICOM AI, the official AI assistant for international students living and studying in Korea.

You specialize in helping students with:
- 🛂 Visa guidance (D-2, D-4, F-2, ARC card, extensions, immigration office procedures)
- 🏠 Housing (dormitory applications, gosiwon, monthly rent, key money/jeonse)
- 🏦 Banking (Kakao Bank, Shinhan, Woori — how to open as a foreigner, international transfers)
- 🏥 Health insurance (NHIS enrollment, hospital visits, international clinics)
- 📚 University life (enrollment, scholarships, TOPIK preparation)
- 💼 Jobs & internships (D-2 compatible work, part-time rules, finding opportunities)
- 🚇 Daily life (T-money, subway, food, shopping, cultural tips)
- 🇰🇷 Korean language help and translation
- 🆘 Emergency guidance (police 112, ambulance 119, immigration helpline 1345)

Guidelines:
- Be warm, encouraging, and practical
- Give step-by-step instructions when needed
- Reference specific Korean systems (Hi Korea portal, Government24, NHIS website)
- For Korean translation, show both Korean and English
- Keep responses concise — use bullet points for steps
- Respond in the same language the student writes in
"""


def _get_client():
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        return None
    from groq import Groq
    return Groq(api_key=api_key)


def _build_db_context(user_id=None) -> str:
    """Give ICOM AI read access to live platform data so it can answer with
    real jobs, clubs, and the student's own profile — not just generic advice.

    Only PUBLIC data (active jobs + clubs) and the REQUESTING user's own
    profile are included. Never other users' personal info.
    """
    parts: list[str] = []

    # ── The student's own profile (personalization) ───────────────────────────
    if user_id:
        try:
            u = User.query.get(int(user_id))
            if u:
                parts.append(
                    "THE STUDENT YOU ARE HELPING:\n"
                    f"- Name: {u.name}\n"
                    f"- University: {u.university or 'unknown'}\n"
                    f"- Visa: {u.visa_type or 'unknown'}\n"
                    f"- Country: {u.country or 'unknown'}\n"
                    "Use this to personalize answers (e.g. match jobs to their visa)."
                )
        except Exception:
            pass

    # ── Live internships / jobs ───────────────────────────────────────────────
    try:
        jobs = (
            Job.query.filter_by(is_active=True)
            .order_by(Job.created_at.desc())
            .limit(25)
            .all()
        )
        if jobs:
            lines = []
            for j in jobs:
                friendly = (j.foreigner_friendly or "").lower()
                tag = " [foreigner-friendly]" if friendly == "yes" else ""
                lines.append(
                    f"- {j.title} @ {j.company} — {j.location or 'Korea'} "
                    f"— visa: {j.visa_compatible or 'N/A'}{tag} — apply: {j.apply_link or 'N/A'}"
                )
            parts.append(
                "CURRENT INTERNSHIPS / JOBS ON ICOM (recommend these when asked "
                "about work; give the apply link):\n" + "\n".join(lines)
            )
    except Exception:
        pass

    # ── Clubs & communities ───────────────────────────────────────────────────
    try:
        clubs = Club.query.filter_by(is_active=True).limit(40).all()
        if clubs:
            lines = [
                f"- {c.name} ({c.club_type or 'club'}, {c.category or 'general'}"
                + (f", {c.university}" if c.university else "") + ")"
                for c in clubs
            ]
            parts.append(
                "CLUBS & COMMUNITIES ON ICOM (recommend these when asked about "
                "community, friends, or activities):\n" + "\n".join(lines)
            )
    except Exception:
        pass

    if not parts:
        return ""
    return (
        "\n\n=== LIVE ICOM PLATFORM DATA (use this to answer with real, "
        "up-to-date info) ===\n" + "\n\n".join(parts)
    )


# ── ICOM guide passages (retrieval) ──────────────────────────────────────────
# backend/data/guides.json is built from the website's guide pages by
# build_guide_index.py. For each question we pick the best-matching passages,
# tell the model to answer from them, and return the guides as sources so
# students can check visa and paperwork answers themselves.

_GUIDES = None
_STOP = set("the a an and or to of in on for is are am i my me how what when where which who why can could do does "
            "did with at by from it be you your we our this that there have has need want get should will would "
            "about into any some much many more most just also please tell know".split())
_EXPAND = {
    "arc": ["alien", "registration", "외국인등록증"], "visa": ["immigration", "d-2", "d-4", "extension"],
    "extend": ["extension", "renew"], "bank": ["account", "banking"], "money": ["bank", "transfer"],
    "insurance": ["nhis", "health"], "hospital": ["insurance", "nhis", "clinic"], "doctor": ["hospital", "clinic"],
    "dorm": ["housing", "dormitory"], "rent": ["housing", "deposit"], "apartment": ["housing", "rent"],
    "phone": ["sim", "plan", "number"], "bus": ["transport", "t-money"], "subway": ["transport", "t-money"],
    "work": ["part-time", "permit", "job"], "job": ["part-time", "permit", "work"], "korean": ["topik", "language"],
}


def _guide_data():
    global _GUIDES
    if _GUIDES is None:
        import json
        path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "guides.json")
        try:
            with open(path, encoding="utf-8") as f:
                _GUIDES = json.load(f)
        except (OSError, ValueError):
            _GUIDES = []
    return _GUIDES


def find_guide_passages(question: str, limit: int = 4):
    """Best-matching guide passages for a question: [(guide, passage), ...]."""
    import re
    words = {w for w in re.findall(r"[a-z0-9\-]+|[가-힣]+", question.lower()) if w not in _STOP and len(w) > 1}
    for w in list(words):
        words.update(_EXPAND.get(w, []))
    if not words:
        return []
    scored = []
    for g in _guide_data():
        title = f"{g['slug']} {g['title']}".lower()
        for chunk in g["chunks"]:
            text = chunk.lower()
            score = sum(1 for w in words if w in text) + sum(2 for w in words if w in title)
            if score >= 3:
                scored.append((score, g, chunk))
    scored.sort(key=lambda s: -s[0])
    if not scored:
        return []
    # Keep only passages close to the best match, so weak matches don't show as sources.
    best = scored[0][0]
    return [(g, chunk) for score, g, chunk in scored[:limit] if score >= best * 0.6]


@ai_bp.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    history = data.get("history") or []

    if not message:
        return jsonify({"error": "Message is required."}), 400

    client = _get_client()
    if client is None:
        return jsonify({
            "error": "AI not configured. Add GROQ_API_KEY to backend/.env"
        }), 503

    # Resolve the signed-in user (optional) so the AI can personalize and so we
    # can save history later.
    current_user_id = None
    try:
        verify_jwt_in_request(optional=True)
        ident = get_jwt_identity()
        if ident:
            current_user_id = int(ident)
    except Exception:
        current_user_id = None

    # Give the AI live read-access to ICOM's data (jobs, clubs, the user's own
    # profile) so it answers with real listings instead of generic advice.
    db_context = _build_db_context(current_user_id)
    passages = find_guide_passages(message)
    guide_context = ""
    if passages:
        guide_context = (
            "\n\n=== ICOM GUIDE EXCERPTS (answer from these first; they are ICOM's checked guides) ===\n"
            + "\n".join(f"[{g['title']}] {chunk}" for g, chunk in passages)
            + "\nIf the excerpts don't cover the question, say so and suggest the student confirm with "
              "their international office or HiKorea (1345). Never invent fees, deadlines or rules."
        )
    sources = []
    for g, _ in passages:
        if all(s["url"] != g["url"] for s in sources):
            sources.append({"title": g["title"], "url": g["url"]})
    system_content = SYSTEM_PROMPT + guide_context + db_context

    messages = [{"role": "system", "content": system_content}]

    for turn in history[-10:]:
        role = turn.get("role")
        content = turn.get("content")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": message})

    try:
        response = complete(client, messages, max_tokens=1200, temperature=0.7)
        reply = (response.choices[0].message.content or "").strip()
        if not reply:
            raise AIUnavailable("empty reply")
    except Exception as e:
        print(f"[ai/chat] {e}")       # details stay in the server log
        return jsonify({"error": AI_DOWN}), 502

    # Optionally save history if user is authenticated
    try:
        user_id = current_user_id
        if user_id:
            session = AISession.query.filter_by(user_id=int(user_id)).order_by(
                AISession.updated_at.desc()
            ).first()
            if not session:
                session = AISession(user_id=int(user_id), messages=[])
                db.session.add(session)
            msgs = list(session.messages or [])
            msgs.append({"role": "user", "content": message})
            msgs.append({"role": "assistant", "content": reply})
            session.messages = msgs[-40:]
            db.session.commit()
    except Exception:
        pass

    return jsonify({"reply": reply, "sources": sources[:2]}), 200


@ai_bp.route("/translate", methods=["POST"])
def translate():
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()
    target = data.get("target", "en")

    if not text:
        return jsonify({"error": "Text is required."}), 400

    client = _get_client()
    if client is None:
        return jsonify({"error": "AI not configured."}), 503

    lang_name = "English" if target == "en" else "Korean"
    prompt = f"Translate the following text to {lang_name}. Return only the translation:\n\n{text}"

    try:
        response = complete(client, [{"role": "user", "content": prompt}], max_tokens=1000, temperature=0.2)
        translation = (response.choices[0].message.content or "").strip()
    except Exception as e:
        print(f"[ai/translate] {e}")
        return jsonify({"error": AI_DOWN}), 502

    return jsonify({"translation": translation, "original": text, "target": target}), 200


@ai_bp.route("/restaurants", methods=["POST"])
def restaurants():
    data = request.get_json(silent=True) or {}
    city = (data.get("city") or "Jeonju").strip()
    nationality = (data.get("nationality") or "").strip()

    client = _get_client()
    if client is None:
        return jsonify({"error": "AI not configured."}), 503

    nationality_line = f"The user is from {nationality}." if nationality else "The user's nationality is unknown."
    prompt = f"""You are a local food guide for international students living in Korea.

{nationality_line}
The user is currently in {city}, South Korea.

Return a JSON object with exactly this structure:
{{
  "korean": [
    {{ "name": "...", "korean": "...", "type": "...", "price": "...", "rating": 4.7, "note": "...", "emoji": "..." }}
  ],
  "foreign": [
    {{ "name": "...", "korean": "...", "type": "...", "price": "...", "rating": 4.5, "note": "...", "emoji": "..." }}
  ]
}}

Rules:
- "korean": exactly 1 well-known, affordable Korean restaurant or food spot popular with students in {city}. Include price in Korean Won.
- "foreign": 4 to 5 real restaurants in {city} serving international or ethnic food. Prioritise cuisine from the user's home country ({nationality if nationality else 'unknown'}) first, then other popular foreign cuisines (Chinese, Indian, Vietnamese, Turkish, Italian, etc.) that are actually present in {city}. If the user is Korean or nationality is unknown, return a variety of non-Korean Asian restaurants. Include price in Korean Won.
- "korean" field in each item is the Korean name/hangul of the restaurant.
- "note" is a one-sentence practical tip for a student.
- "emoji" is a single food emoji that matches the cuisine.
- Return ONLY the raw JSON. No markdown, no explanation, no extra text."""

    try:
        response = complete(client, [{"role": "user", "content": prompt}], max_tokens=1500, temperature=0.6)
        raw = (response.choices[0].message.content or "").strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        import json
        result = json.loads(raw)
    except Exception as e:
        print(f"[ai/restaurants] {e}")
        return jsonify({"error": AI_DOWN}), 502

    return jsonify(result), 200


@ai_bp.route("/health", methods=["GET"])
def health():
    has_key = bool(os.environ.get("GROQ_API_KEY"))
    return jsonify({"status": "ok", "ai_configured": has_key, "provider": "groq", "model": current_model()}), 200
