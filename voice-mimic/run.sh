#!/usr/bin/env bash
# Start VoiceMimic with the real XTTS-v2 cloning engine.
# The virtualenv lives OUTSIDE iCloud (~/.venvs/voicemimic) so multi-GB model
# files and thousands of package files don't get synced/evicted by iCloud.
set -e

VENV="$HOME/.venvs/voicemimic"
HERE="$(cd "$(dirname "$0")" && pwd)"
PORT="${PORT:-5001}"

if [ ! -x "$VENV/bin/python" ]; then
  echo "❌ venv not found at $VENV — run ./setup.sh first."
  exit 1
fi

echo "🎙️  VoiceMimic starting on http://localhost:$PORT  (first load takes ~15s to load the model)"
cd "$HERE"
exec env PORT="$PORT" COQUI_TOS_AGREED=1 "$VENV/bin/python" app.py
