from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
import os

from app import db
from models import User, AISession, Job, Club

ai_bp = Blueprint("ai", __name__)

# Groq model — llama-3.3-70b-versatile is fast, free tier, and high quality.
# Alternatives: "llama-3.1-8b-instant" (ultra-fast), "mixtral-8x7b-32768" (large context)
GROQ_MODEL = "llama-3.3-70b-versatile"

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
    system_content = SYSTEM_PROMPT + db_context

    messages = [{"role": "system", "content": system_content}]

    for turn in history[-10:]:
        role = turn.get("role")
        content = turn.get("content")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": message})

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            max_tokens=600,
            temperature=0.7,
        )
        reply = response.choices[0].message.content.strip()
    except Exception as e:
        return jsonify({"error": f"Groq error: {str(e)}"}), 502

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

    return jsonify({"reply": reply}), 200


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
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400,
            temperature=0.2,
        )
        translation = response.choices[0].message.content.strip()
    except Exception as e:
        return jsonify({"error": str(e)}), 502

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
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=700,
            temperature=0.6,
        )
        raw = response.choices[0].message.content.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        import json
        result = json.loads(raw)
    except Exception as e:
        return jsonify({"error": f"AI error: {str(e)}"}), 502

    return jsonify(result), 200


@ai_bp.route("/health", methods=["GET"])
def health():
    has_key = bool(os.environ.get("GROQ_API_KEY"))
    return jsonify({"status": "ok", "ai_configured": has_key, "provider": "groq", "model": GROQ_MODEL}), 200
