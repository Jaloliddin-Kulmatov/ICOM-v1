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
| Deployment | Vercel (frontend) · Render (API) · Neon (Postgres) |

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

## Deploying (free tier)

| Part | Service | Config |
|---|---|---|
| Frontend | Vercel (Hobby), Seoul region | `vercel.json` |
| Backend | Render (Free), Singapore region | `render.yaml` |
| Database | Neon Postgres (Free), AWS Singapore | `DATABASE_URL` |

1. **Database:** create a Neon project in AWS Singapore and copy its connection string (`postgresql://…?sslmode=require`).
2. **Backend:** in Render choose *New → Blueprint* and point it at this repo. It reads `render.yaml`. Fill in `DATABASE_URL`, `FRONTEND_URL` (`https://icom.ai.kr,https://www.icom.ai.kr`), `GROQ_API_KEY`, `SCRAPER_SECRET` and `ADMIN_SECRET`. The build runs `python bootstrap.py`, which creates tables and seeds data, so the web process starts fast.
3. **Frontend:** import the repo in Vercel and set `NEXT_PUBLIC_API_URL` (your Render URL + `/api`) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. Point `icom.ai.kr` at Vercel in your DNS.
4. **Scraper:** set the `ICOM_API_URL` and `SCRAPER_SECRET` GitHub secrets so `.github/workflows/scrape-jobs.yml` keeps adding internships twice a day.
5. **Keep the API awake (optional):** free Render instances sleep after 15 minutes. A free uptime monitor hitting `/api/health` every 10 minutes keeps it warm.

---

## Environment Variables Reference

### Backend (`backend/.env`)
```env
FLASK_ENV=production
SECRET_KEY=random_secret_here
JWT_SECRET_KEY=random_jwt_secret_here
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
DATABASE_URL=postgresql://user:pass@host/dbname
FRONTEND_URL=https://icom.ai.kr,https://www.icom.ai.kr
STARTUP_TASKS=0
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=https://<your-render-service>.onrender.com/api
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
│   │   ├── guide/              # Guide: arrival checklist, visa, housing, banking…
│   │   │   └── living/         # Daily life: places near you, restaurants, transport
│   │   ├── universities/       # University directory
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

**Backend sleeps on free tier** — Render's free tier spins down after 15 min of inactivity, so the first request takes a while. Use an uptime monitor on `/api/health`, or upgrade to a paid instance.

**Database resets** — SQLite resets on every deploy. Use Neon Postgres via `DATABASE_URL` to persist data.

**CORS errors** — Make sure `FRONTEND_URL` in your backend env matches your frontend URL exactly (no trailing slash).

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
