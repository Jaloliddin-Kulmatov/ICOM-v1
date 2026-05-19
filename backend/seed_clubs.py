"""
Seed script — adds famous international clubs and communities.
Run once after the backend has started at least once (so tables exist):

    python seed_clubs.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app, db
from models import User, Club
from flask_bcrypt import Bcrypt

SEED_CLUBS = [
    # ── International Communities ─────────────────────────────────
    {
        "name": "Uzbek Students Community — JBNU",
        "description": "For Uzbek international students at JBNU and across Jeonju. Share experiences, get support navigating Korean life, and celebrate Uzbek culture with Navro'z and Ramadan gatherings.",
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every Friday 5:30pm",
        "location": "International House, Room 102",
        "club_type": "community",
        "country": "Uzbekistan",
    },
    {
        "name": "Chinese Students & Scholars Association (CSSA JBNU)",
        "description": "The largest international student organization at JBNU. Academic support networks, Spring Festival galas, Mid-Autumn celebrations, and professional networking for Chinese scholars.",
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Bi-weekly Saturday 3pm",
        "location": "Multi-Cultural Hall B101",
        "club_type": "community",
        "country": "China",
    },
    {
        "name": "Vietnamese Student Community — Jeonju",
        "description": "Connecting Vietnamese students across Jeonju. Tết Nguyên Đán celebrations, scholarship guidance, Korean visa tips, and a home away from home.",
        "category": "social",
        "university": "JBNU",
        "meeting_time": "Every Sunday 4pm",
        "location": "Student Union Room 205",
        "club_type": "community",
        "country": "Vietnam",
    },
    {
        "name": "Mongolian Students Association Korea",
        "description": "Supporting Mongolian students with language help, Tsagaan Sar celebrations, cultural nights, and academic solidarity across Jeonju and the Jeollabuk-do region.",
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every Saturday 2pm",
        "location": "Global Lounge B1",
        "club_type": "community",
        "country": "Mongolia",
    },
    {
        "name": "Nepali Students Society Korea",
        "description": "Dashain, Tihar, Holi and more — celebrating Nepali culture in Korea. We also help with visa extensions, banking setup, and finding halal/vegetarian food in Jeonju.",
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every 2nd Saturday 3pm",
        "location": "Student Center Room 301",
        "club_type": "community",
        "country": "Nepal",
    },
    {
        "name": "Indonesian Students Association — PPI Jeonju",
        "description": "PPI (Perhimpunan Pelajar Indonesia) chapter in Jeonju. Indonesian Independence Day events, rendang cooking nights, and solidarity across universities in the region.",
        "category": "social",
        "university": "JBNU",
        "meeting_time": "Every 1st Sunday 3pm",
        "location": "International House Lobby",
        "club_type": "community",
        "country": "Indonesia",
    },
    {
        "name": "Nigerian & African Students Association Korea",
        "description": "Pan-African community at JBNU. Afrobeats nights, Jollof cookoffs, African cultural exchange, academic mutual aid, and networking events with Korean companies.",
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every 1st Saturday 5pm",
        "location": "Multicultural Room A",
        "club_type": "community",
        "country": "Nigeria",
    },
    {
        "name": "Russian-Speaking Students Club",
        "description": "A community for students from Russia, Kazakhstan, Belarus, Kyrgyzstan, and other Russian-speaking countries. Language exchange, movie nights, and holiday celebrations.",
        "category": "social",
        "university": "JBNU",
        "meeting_time": "Every Thursday 6:30pm",
        "location": "Humanitas Hall Room 108",
        "club_type": "community",
        "country": "Russia",
    },
    {
        "name": "Indian Students Association Korea (ISAK)",
        "description": "Diwali lights, Holi colors, cricket tournaments, biryani potlucks and more. A vibrant community for Indian students to thrive, network, and celebrate culture in Korea.",
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every Sunday 2pm",
        "location": "Student Union Room 210",
        "club_type": "community",
        "country": "India",
    },
    {
        "name": "Kazakh & Central Asian Student Hub",
        "description": "A welcoming community for students from Kazakhstan, Tajikistan, Turkmenistan, and all of Central Asia studying at JBNU. Nauryz celebrations, food, and mutual support.",
        "category": "social",
        "university": "JBNU",
        "meeting_time": "Every Saturday 4pm",
        "location": "Global Lounge 2nd Floor",
        "club_type": "community",
        "country": "Kazakhstan",
    },

    # ── University Clubs ──────────────────────────────────────────
    {
        "name": "JBNU International Hiking Club",
        "description": "Explore Korea's breathtaking mountains together! Weekly hikes to Naejangsan, Deogyusan, Maisan, and overnight trips to Seoraksan. All fitness levels welcome — we go at everyone's pace.",
        "category": "sports",
        "university": "JBNU",
        "meeting_time": "Every Saturday 7:00am",
        "location": "Main Gate Parking Lot",
        "club_type": "club",
        "country": "",
    },
    {
        "name": "JBNU K-Pop & Dance Club",
        "description": "Learn K-Pop choreography, perform at JBNU festivals, and make lifelong friends through dance. BTS, BLACKPINK, aespa and more — perfect for beginners and experienced dancers alike.",
        "category": "arts",
        "university": "JBNU",
        "meeting_time": "Tuesday & Thursday 7pm",
        "location": "Student Hall Dance Practice Room B",
        "club_type": "club",
        "country": "",
    },
    {
        "name": "Korean Language Exchange Club",
        "description": "1-on-1 and group Korean ↔ English (and other languages) exchange sessions. Improve your Korean while helping Korean students with your native language. TOPIK study groups every month.",
        "category": "language",
        "university": "JBNU",
        "meeting_time": "Every Wednesday 5pm",
        "location": "Language Lab Room 3, Humanities Building",
        "club_type": "club",
        "country": "",
    },
    {
        "name": "JBNU Tech & AI Collective",
        "description": "Coding sprints, AI workshops, hackathons, and tech talks from industry speakers. Build your portfolio, collaborate on open-source, and prep for Korean tech company interviews.",
        "category": "tech",
        "university": "JBNU",
        "meeting_time": "Every Tuesday 6pm",
        "location": "Engineering Building Room 404",
        "club_type": "club",
        "country": "",
    },
    {
        "name": "Jeonju Food & Culture Explorers",
        "description": "Discover Korea's food capital! Restaurant tours through the Hanok Village, traditional makgeolli tastings, bibimbap masterclasses, and seasonal Korean cooking workshops.",
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every Friday 6pm",
        "location": "Hanok Village South Gate Meeting Point",
        "club_type": "club",
        "country": "",
    },
]


def seed():
    app = create_app()
    bcrypt = Bcrypt(app)

    with app.app_context():
        # Get or create the ICOM system user (clubs creator)
        admin = User.query.filter_by(email="system@konect.kr").first()
        if not admin:
            admin = User(
                name="ICOM Team",
                email="system@konect.kr",
                password_hash=bcrypt.generate_password_hash("ICOM_SYSTEM_NO_LOGIN_9x!").decode(),
                university="JBNU",
                role="admin",
                is_verified=True,
            )
            db.session.add(admin)
            db.session.commit()
            print(f"  ✓ Created system user (id={admin.id})")
        else:
            print(f"  · System user already exists (id={admin.id})")

        added = 0
        skipped = 0
        for data in SEED_CLUBS:
            existing = Club.query.filter_by(name=data["name"]).first()
            if existing:
                print(f"  · Skip (exists): {data['name']}")
                skipped += 1
                continue

            club = Club(
                name=data["name"],
                description=data["description"],
                category=data["category"],
                university=data["university"],
                meeting_time=data["meeting_time"],
                location=data["location"],
                club_type=data["club_type"],
                country=data.get("country", ""),
                kakao_link="",
                contact="",
                created_by=admin.id,
                is_active=True,
            )
            db.session.add(club)
            added += 1
            print(f"  ✓ Added: {data['name']}")

        db.session.commit()
        print(f"\nDone! Added {added} clubs/communities, skipped {skipped} existing.")


if __name__ == "__main__":
    seed()
