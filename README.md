<img width="1428" height="779" alt="Screenshot 2026-05-20 at 6 34 54 PM" src="https://github.com/user-attachments/assets/1bbfad44-fc0a-410a-b694-5db67b79a599" />



# ICOM — International Community in Korea, https://icom.ai.kr/

> The all-in-one platform for international students living and studying in Korea.
> Community, internships, visa guides, housing, banking, and an AI assistant — in one place.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS |
| Backend | Flask (Python), SQLAlchemy, Flask-JWT-Extended |
| AI | Groq API (llama-3.3-70b-versatile) |
| Internship scraper | Wanted.co.kr API + Groq/Google Translate auto-translation, APScheduler (06:00 & 18:00 UTC) |
| Database | SQLite (dev) → PostgreSQL (production) |
| Deployment | Render.com |

---

## Local Development

### Prerequisites
- Node.js 20+
- Python 3.11+
- A free [Groq API key](https://console.groq.com)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/icom.git
cd icom
```

### 2. Set up the backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:
```env
GROQ_API_KEY=your_groq_api_key_here
JWT_SECRET_KEY=any_random_secret_string
SECRET_KEY=another_random_secret
FRONTEND_URL=http://localhost:3000
```

Start the backend:
```bash
python run.py
# Runs on http://localhost:5001
```

### 3. Set up the frontend
```bash
# From the project root
npm install
```

Create `.env.local` in the root:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

Start the frontend:
```bash
npm run dev
# Runs on http://localhost:3000
```

---

## Deploying to Render — Step by Step

### Step 1 — Push to GitHub

1. Create a new repo on [github.com](https://github.com/new)
2. Run these commands in your project folder:
```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/icom.git
git push -u origin main
```

---

### Step 2 — Create a PostgreSQL Database on Render

1. Go to [render.com](https://render.com) → Sign up / Log in
2. Click **New +** → **PostgreSQL**
3. Fill in:
   - **Name:** `icom-db`
   - **Database:** `icom`
   - **User:** `icom`
   - **Plan:** Free
4. Click **Create Database**
5. Wait ~1 minute, then copy the **Internal Database URL** — you'll need it in Step 3

---

### Step 3 — Deploy the Flask Backend

1. Click **New +** → **Web Service**
2. Connect your GitHub repo
3. Fill in these settings:

| Field | Value |
|---|---|
| **Name** | `icom-backend` |
| **Root Directory** | `backend` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn run:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120` |
| **Plan** | Free |

4. Scroll to **Environment Variables** and add:

| Key | Value |
|---|---|
| `FLASK_ENV` | `production` |
| `SECRET_KEY` | *(click Generate)* |
| `JWT_SECRET_KEY` | *(click Generate)* |
| `GROQ_API_KEY` | `your_groq_key_from_console.groq.com` |
| `DATABASE_URL` | *(paste Internal Database URL from Step 2)* |
| `FRONTEND_URL` | `https://icom-frontend.onrender.com` *(fill after Step 4)* |

5. Click **Create Web Service**
6. Wait for it to build (~3 min). Copy the URL — e.g. `https://icom-backend.onrender.com`

---

### Step 4 — Deploy the Next.js Frontend

1. Click **New +** → **Web Service**
2. Connect same GitHub repo
3. Fill in:

| Field | Value |
|---|---|
| **Name** | `icom-frontend` |
| **Root Directory** | *(leave empty)* |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | Free |

4. Add **Environment Variable**:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://icom-backend.onrender.com/api` |

5. Click **Create Web Service**
6. Wait for build (~5 min). Your site is live at `https://icom-frontend.onrender.com`

---

### Step 5 — Link backend to frontend

1. Go back to your **icom-backend** service on Render
2. Go to **Environment** tab
3. Update `FRONTEND_URL` to `https://icom-frontend.onrender.com`
4. Click **Save Changes** → Render auto-redeploys

---

### Step 6 — Verify everything works

Open your frontend URL and check:
- ✅ Homepage loads
- ✅ Register / Login works
- ✅ Community clubs load
- ✅ AI assistant responds
- ✅ Jobs / Internships load

---

## Environment Variables Reference

### Backend (`backend/.env`)
```env
FLASK_ENV=production
SECRET_KEY=random_secret_here
JWT_SECRET_KEY=random_jwt_secret_here
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
DATABASE_URL=postgresql://user:pass@host/dbname
FRONTEND_URL=https://icom-frontend.onrender.com
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=https://icom-backend.onrender.com/api
```

---

## Project Structure

```
icom/
├── src/                        # Next.js frontend
│   ├── app/                    # App Router pages
│   │   ├── page.tsx            # Landing page
│   │   ├── chat/               # Community Q&A (All Korea + per-university chat)
│   │   ├── jobs/               # Internships (list + detail)
│   │   ├── community/          # Clubs & News
│   │   ├── support/            # Guides (visa, housing, etc.)
│   │   ├── universities/       # University directory
│   │   ├── daily-life/         # Maps, restaurants, transport
│   │   ├── admin/              # Admin panel (scraper controls, moderation)
│   │   └── dashboard/          # User dashboard + AI chat
│   ├── components/             # Shared UI components
│   │   ├── layout/             # Navbar, Footer, MobileBottomNav
│   │   └── ai/                 # Floating AI chat widget
│   └── lib/                    # Auth, utils, constants
│
├── backend/                    # Flask API
│   ├── app.py                  # App factory + migrations + scheduler + seeds
│   ├── models.py               # SQLAlchemy models
│   ├── run.py                  # Entry point
│   ├── requirements.txt        # Python dependencies
│   ├── scrapers/
│   │   └── wanted.py           # Wanted.co.kr internship scraper + translation
│   └── routes/
│       ├── auth.py             # Register / Login / Profile
│       ├── ai.py               # Groq AI chat + restaurants
│       ├── chat.py             # Community Q&A (posts, answers, moderation, scope)
│       ├── clubs.py            # Clubs & communities
│       ├── posts.py            # News feed
│       ├── search.py           # Global search
│       ├── feedback.py         # User feedback inbox
│       ├── admin.py            # Job management + scraper triggers
│       └── ambassador.py       # Ambassador applications
│
├── render.yaml                 # Render deploy config
├── poster-final.html           # Promotional poster (1200×627, LinkedIn-ready)
└── README.md
```

---

## Key Features

- 💬 **Community Q&A (Chat)** — Reddit-style questions & answers with image uploads and automatic content moderation (terror / sexual / hate content is blocked). Two scopes: **All Korea** (global) and a **per-university chat** (e.g. "JBNU Chat") — university posts stay private to that university and never leak into the global feed. Local questions surface first by region.
- 🌍 **Community** — Join clubs and national communities, member-only club chat
- 💼 **Internships** — Live listings scraped twice daily from Wanted.co.kr, **auto-translated to English** (Groq → Google Translate fallback) and **AI-classified for foreigner-friendliness** (Korean-only postings are flagged or skipped). Real apply links, real deadlines (rolling when none is published), apply-click tracking, opt-in job alerts, and live "Top Hiring Companies".
- 🤖 **AI Assistant** — Powered by Groq, answers visa/housing/banking questions. Reachable from every page via a floating chat widget.
- 📖 **Support Guides** — Step-by-step guides for visa, banking, housing, insurance, transport, Korean language
- 🏫 **Universities** — JBNU and Korean university directory + ambassador program
- 🗺️ **Daily Life** — Nearby restaurants (personalised by nationality), transport tips
- 📰 **News** — Ambassadors and club owners can post updates
- 📱 **Mobile-first** — Dedicated bottom navigation, responsive layouts, iOS safe-area handling
- 🛠️ **Admin panel** — One-click scraper run / reset & re-scrape with an accurate "added N new internships" report, deadline cleanup, and content moderation

---

## Common Issues

**Backend sleeps on free tier** — Render's free tier spins down after 15 min of inactivity. First request takes ~30 seconds to wake up. Upgrade to Starter ($7/mo) to keep it always-on.

**Database resets** — SQLite resets on every deploy. Use PostgreSQL (Step 2) to persist data.

**CORS errors** — Make sure `FRONTEND_URL` in your backend env exactly matches your frontend Render URL (no trailing slash).

**Build fails** — Make sure `gunicorn` and `psycopg2-binary` are in `requirements.txt` (they are already included).

---

## Author

**Kulmatov Jaloliddin** — Founder, JBNU (Jeonbuk National University)

- 🌐 Portfolio — https://portfolio-n5v3.vercel.app/
- 💼 LinkedIn — https://www.linkedin.com/in/jaloliddin-kulmatov-69a81a406/
- 🐙 GitHub — https://github.com/Jaloliddin-Kulmatov
- ✈️ Telegram — https://t.me/jaloliddinkulmatov
- ✉️ Email — jaloliddinqulmatov12@gmail.com

Built by a student, for students. Live at **[icom.ai.kr](https://icom.ai.kr/)**.

---

## License

MIT — free to use and modify.
