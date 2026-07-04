#!/usr/bin/env bash
# Convenience launcher: creates a venv, installs deps, runs the app.
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements.txt

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env — add your ANTHROPIC_API_KEY to enable AI features."
fi

python app.py
