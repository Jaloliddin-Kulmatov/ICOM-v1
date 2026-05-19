#!/bin/bash
# Start both Flask backend and Next.js frontend

echo "🚀 Starting ICON Platform..."

# Kill any previous instances
lsof -ti tcp:5001 | xargs kill -9 2>/dev/null
lsof -ti tcp:3000 | xargs kill -9 2>/dev/null
sleep 1

# ── Backend ──────────────────────────────────────────────────
echo ""
echo "📦 Setting up Flask backend..."
cd "$(dirname "$0")/backend"

if [ ! -d ".venv" ]; then
  echo "  Creating virtual environment..."
  python3 -m venv .venv
fi

source .venv/bin/activate

echo "  Installing Python packages..."
pip install -r requirements.txt -q

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "  ⚠️  Created backend/.env from example. Add your OPENAI_API_KEY there."
fi

echo "  Starting Flask on http://localhost:5001 ..."
python run.py &
FLASK_PID=$!

# ── Frontend ─────────────────────────────────────────────────
echo ""
echo "🌐 Starting Next.js frontend..."
cd "$(dirname "$0")"

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || true

echo "  Starting Next.js on http://localhost:3000 ..."
npm run dev &
NEXT_PID=$!

echo ""
echo "✅ ICON is running!"
echo "   Frontend → http://localhost:3000"
echo "   Backend  → http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop both servers."
echo ""

# Wait and clean up on exit
trap "echo ''; echo 'Stopping...'; kill $FLASK_PID $NEXT_PID 2>/dev/null; exit 0" INT
wait
