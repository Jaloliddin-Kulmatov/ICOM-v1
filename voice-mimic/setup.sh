#!/usr/bin/env bash
# One-time setup for VoiceMimic's real XTTS-v2 voice cloning.
#
# Creates a Python 3.12 virtualenv OUTSIDE iCloud and installs the exact,
# mutually-compatible versions we verified working on Apple Silicon (CPU):
#   - coqui-tts (XTTS-v2)         real zero-shot voice cloning
#   - transformers >=4.57,<5      (5.x removes symbols XTTS still imports)
#   - torch/torchaudio 2.8.0      (2.9+ forces torchcodec -> needs system ffmpeg)
set -e

VENV="$HOME/.venvs/voicemimic"
PY="$(command -v python3.12 || command -v /opt/homebrew/bin/python3.12)"

if [ -z "$PY" ]; then
  echo "❌ Python 3.12 not found. Install it (e.g. 'brew install python@3.12')."
  exit 1
fi

echo "▶ Creating venv at $VENV using $PY"
rm -rf "$VENV"
"$PY" -m venv "$VENV"
"$VENV/bin/pip" install --upgrade pip

echo "▶ Installing Flask + coqui-tts (this downloads a lot)…"
"$VENV/bin/pip" install "Flask>=3.0" "coqui-tts>=0.24"

echo "▶ Pinning compatible transformers + torch…"
"$VENV/bin/pip" install "transformers>=4.57,<5" "torch==2.8.0" "torchaudio==2.8.0"

echo "▶ Pre-downloading the XTTS-v2 model (~1.9 GB, one time)…"
COQUI_TOS_AGREED=1 "$VENV/bin/python" - <<'PY'
import warnings; warnings.filterwarnings("ignore")
from TTS.api import TTS
TTS("tts_models/multilingual/multi-dataset/xtts_v2")
print("✅ XTTS-v2 ready.")
PY

echo "✅ Setup complete. Start the app with:  ./run.sh"
