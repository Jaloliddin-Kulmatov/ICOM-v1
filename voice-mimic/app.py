"""
VoiceMimic — Flask backend.

Endpoints
  GET  /                 -> the single-page UI
  GET  /api/status       -> which backend is active + whether it clones
  GET  /api/voices       -> picker options (voices or languages) for the backend
  POST /api/clone        -> multipart: `audio` + `text` (+ language/voice/speed)
                            -> JSON with a URL to the generated clip
  GET  /outputs/<name>   -> serve a generated clip
"""

from __future__ import annotations

import os
import shutil
import subprocess
import time
import uuid

from flask import Flask, jsonify, request, send_from_directory, render_template
from werkzeug.utils import secure_filename

from voice_engine import VoiceEngine

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

ALLOWED_EXT = {".wav", ".mp3", ".m4a", ".aac", ".ogg", ".flac", ".webm", ".aiff"}
MAX_CONTENT_LENGTH = 25 * 1024 * 1024  # 25 MB
MAX_TEXT_LEN = 1000

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

print("[app] loading voice engine...")
engine = VoiceEngine()
print(f"[app] backend = {engine.backend} (cloning={engine.cloning})")


def _ext(filename: str) -> str:
    return os.path.splitext(filename)[1].lower()


def _to_wav(src_path: str) -> str:
    """Normalise any uploaded audio to mono 22.05k WAV for the engine."""
    if _ext(src_path) == ".wav":
        return src_path
    dst = os.path.splitext(src_path)[0] + "_norm.wav"
    if shutil.which("ffmpeg"):
        subprocess.run(
            ["ffmpeg", "-y", "-i", src_path, "-ac", "1", "-ar", "22050", dst],
            check=True, capture_output=True,
        )
        return dst
    if shutil.which("afconvert"):
        subprocess.run(
            ["afconvert", "-f", "WAVE", "-d", "LEI16@22050", "-c", "1", src_path, dst],
            check=True, capture_output=True,
        )
        return dst
    raise RuntimeError(
        "Could not convert audio to WAV (no ffmpeg/afconvert). Upload a .wav file."
    )


@app.route("/")
def index():
    return render_template("index.html", info=engine.info)


@app.route("/api/status")
def status():
    return jsonify(engine.info)


@app.route("/api/voices")
def voices():
    return jsonify(engine.list_voices())


@app.route("/api/clone", methods=["POST"])
def clone():
    text = (request.form.get("text") or "").strip()
    if not text:
        return jsonify({"error": "Please enter some text to speak."}), 400
    if len(text) > MAX_TEXT_LEN:
        return jsonify({"error": f"Text too long (max {MAX_TEXT_LEN} chars)."}), 400

    language = (request.form.get("language") or "en").strip()
    voice = (request.form.get("voice") or "").strip() or None
    try:
        speed = float(request.form.get("speed") or 1.0)
    except ValueError:
        speed = 1.0

    if "audio" not in request.files or request.files["audio"].filename == "":
        return jsonify({"error": "Please upload a reference voice clip."}), 400

    f = request.files["audio"]
    ext = _ext(f.filename)
    if ext not in ALLOWED_EXT:
        return jsonify({"error": f"Unsupported file type '{ext}'."}), 400

    token = uuid.uuid4().hex
    safe_name = secure_filename(f.filename) or f"clip{ext}"
    raw_path = os.path.join(UPLOAD_DIR, f"{token}_{safe_name}")
    f.save(raw_path)

    out_name = f"voicemimic_{token}.wav"
    out_path = os.path.join(OUTPUT_DIR, out_name)

    try:
        ref_wav = _to_wav(raw_path)
        result = engine.synthesize(
            text, ref_wav, out_path, language=language, speed=speed, voice=voice
        )
    except subprocess.CalledProcessError as exc:
        detail = (exc.stderr or b"").decode("utf-8", "ignore")[-300:]
        return jsonify({"error": f"Audio processing failed. {detail}"}), 500
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": str(exc)}), 500
    finally:
        if os.path.exists(raw_path):
            try:
                os.remove(raw_path)
            except OSError:
                pass

    return jsonify(
        {
            "url": f"/outputs/{out_name}?t={int(time.time())}",
            "backend": result.backend,
            "cloned": result.cloned,
            "note": result.note,
        }
    )


@app.route("/outputs/<path:name>")
def serve_output(name):
    return send_from_directory(OUTPUT_DIR, name, mimetype="audio/wav")


@app.errorhandler(413)
def too_large(_):
    return jsonify({"error": "File too large (max 25 MB)."}), 413


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    # Reloader disabled: with XTTS active it would load the ~2GB model twice.
    app.run(host="0.0.0.0", port=port, debug=False, use_reloader=False, threaded=True)
