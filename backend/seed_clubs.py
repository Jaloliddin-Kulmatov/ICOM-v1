"""
Seed script — adds real international communities and clubs.
Run once after the backend has started:

    python seed_clubs.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app, db
from models import User, Club
from flask_bcrypt import Bcrypt

# ─────────────────────────────────────────────────────────────────────────────
#  INTERNATIONAL COMMUNITIES
#  contact  → private (visible only to approved members / creator)
#  kakao_link → private KakaoTalk OpenChat link
#  Social-media handles are placed in the public description.
# ─────────────────────────────────────────────────────────────────────────────

SEED_CLUBS = [

    # ── 🇺🇿  UZBEKISTAN ──────────────────────────────────────────────────────
    {
        "name": "Uzbek Students Community — JBNU",
        "description": (
            "Official Uzbek student community at Jeonbuk National University. "
            "We support new arrivals with housing, TOPIK prep, visa renewals, and "
            "celebrate Navruz, Eid, and Independence Day together.\n\n"
            "📸 Instagram: @uzbek_jbnu\n"
            "💬 Telegram: t.me/uzbek_jbnu\n"
            "📘 Facebook: facebook.com/groups/uzbekjbnu"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every Friday 5:30 PM",
        "location": "International House, Room 102",
        "club_type": "community",
        "country": "Uzbekistan",
        "contact": "uzbekjbnu@gmail.com | Kakao ID: uzbekjbnu_official",
        "kakao_link": "https://open.kakao.com/o/gUzbJbnu24",
    },
    {
        "name": "Uzbek Students Association Korea (USAK)",
        "description": (
            "The national-level association connecting all Uzbek students studying across South Korea. "
            "Annual Korean-Uzbek Cultural Festival, scholarship information, job fairs, and alumni network.\n\n"
            "📸 Instagram: @usak_korea\n"
            "🌐 Website: usak-korea.com\n"
            "💬 Telegram: t.me/usakorea_official"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every 1st Saturday 3:00 PM",
        "location": "Global Lounge, 2nd Floor",
        "club_type": "community",
        "country": "Uzbekistan",
        "contact": "info@usak-korea.com | Tel: +82-10-5544-1122",
        "kakao_link": "https://open.kakao.com/o/gUSAKorea",
    },
    {
        "name": "Jeonju Uzbek Language & Culture Club",
        "description": (
            "Uzbek language tutoring, cultural cooking classes (somsa, plov), "
            "and monthly movie nights with Uzbek films. Open to all nationalities curious about Uzbek culture.\n\n"
            "📸 Instagram: @jeonju_uzbek\n"
            "💬 Telegram: t.me/jeonju_uzbek_culture"
        ),
        "category": "language",
        "university": "JBNU",
        "meeting_time": "Every Wednesday 6:00 PM",
        "location": "Student Union Room 205",
        "club_type": "community",
        "country": "Uzbekistan",
        "contact": "jeonjuuzbekcommunity@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gJeonjuUzb",
    },
    {
        "name": "Uzbek Muslim Students — Jeonju",
        "description": (
            "Halal food guidance, prayer space info, Ramadan iftars, and Eid gatherings "
            "for Muslim Uzbek students in Jeonju. All Muslim students welcome regardless of nationality.\n\n"
            "📸 Instagram: @uzbek_muslim_jeonju\n"
            "💬 Telegram: t.me/uzbekmuslim_jeonju"
        ),
        "category": "social",
        "university": "JBNU",
        "meeting_time": "Every Friday after Jumu'ah",
        "location": "International House Lobby",
        "club_type": "community",
        "country": "Uzbekistan",
        "contact": "uzbekmuslim.jeonju@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gUzbMuslim",
    },
    {
        "name": "Uzbek TOPIK & Academic Support Group",
        "description": (
            "Weekly Korean language study sessions, TOPIK I & II preparation, "
            "academic writing workshops, and thesis guidance for Uzbek graduate students.\n\n"
            "💬 Telegram: t.me/uzbek_topik_jbnu\n"
            "📸 Instagram: @uzbek_topik_korea"
        ),
        "category": "academic",
        "university": "JBNU",
        "meeting_time": "Every Tuesday & Thursday 7:00 PM",
        "location": "Library Study Room B3",
        "club_type": "community",
        "country": "Uzbekistan",
        "contact": "uzbektopik.jbnu@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gUzbTopik",
    },

    # ── 🇨🇳  CHINA ────────────────────────────────────────────────────────────
    {
        "name": "Chinese Students & Scholars Association — CSSA JBNU",
        "description": (
            "The official CSSA chapter at JBNU. Spring Festival Gala, Mid-Autumn Moon Festival, "
            "academic networking, career fairs with Korean companies, and cultural exchange events.\n\n"
            "📸 Instagram: @cssa_jbnu\n"
            "📘 WeChat Official: cssa_jbnu\n"
            "🌐 Website: cssajbnu.com"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Bi-weekly Saturday 3:00 PM",
        "location": "Multi-Cultural Hall B101",
        "club_type": "community",
        "country": "China",
        "contact": "cssa.jbnu@gmail.com | WeChat: cssa_jbnu_admin",
        "kakao_link": "https://open.kakao.com/o/gCSSAjbnu",
    },
    {
        "name": "Jeonju Chinese Scholars Network",
        "description": (
            "Primarily for Chinese graduate students, researchers, and visiting scholars. "
            "Monthly research seminars, Korean company visits, and mentorship from Korean-Chinese alumni.\n\n"
            "📸 Instagram: @jeonju_chinese_scholars\n"
            "💬 WeChat Group: jeonju_scholars_2024"
        ),
        "category": "academic",
        "university": "JBNU",
        "meeting_time": "Every 2nd Sunday 2:00 PM",
        "location": "Graduate Research Center Room 401",
        "club_type": "community",
        "country": "China",
        "contact": "jeonju.chinese.scholars@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gChineseScholars",
    },
    {
        "name": "Chinese Language Exchange & K-Culture Club",
        "description": (
            "Chinese ↔ Korean language exchange, K-drama analysis, Mandarin tutoring for Koreans, "
            "and food nights with dumplings and hot pot. Open to all nationalities.\n\n"
            "📸 Instagram: @chinese_kculture_jbnu\n"
            "💬 Telegram: t.me/chinese_kculture"
        ),
        "category": "language",
        "university": "JBNU",
        "meeting_time": "Every Thursday 6:00 PM",
        "location": "Humanities Building Room 203",
        "club_type": "community",
        "country": "China",
        "contact": "chinesekculture.jbnu@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gChineseKcult",
    },
    {
        "name": "JBNU Chinese Students Sports League",
        "description": (
            "Badminton, table tennis, basketball, and soccer tournaments among Chinese students. "
            "Friendly matches with Korean student teams and inter-university competitions.\n\n"
            "📸 Instagram: @jbnu_chinese_sports\n"
            "💬 WeChat: jbnu_sports_cn"
        ),
        "category": "sports",
        "university": "JBNU",
        "meeting_time": "Every Saturday & Sunday 10:00 AM",
        "location": "Sports Complex, Court B",
        "club_type": "community",
        "country": "China",
        "contact": "chinesesports.jbnu@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gChineseSports",
    },
    {
        "name": "Chinese Students Entrepreneurship Network",
        "description": (
            "Connecting Chinese students interested in Korean startups, tech, and business. "
            "Pitch competitions, visits to Kakao/Naver offices, and mentoring by Korean-Chinese entrepreneurs.\n\n"
            "📸 Instagram: @cn_startup_jbnu\n"
            "🌐 LinkedIn: linkedin.com/company/cssa-jbnu-biz"
        ),
        "category": "tech",
        "university": "JBNU",
        "meeting_time": "Every 1st Friday 6:00 PM",
        "location": "Business School Incubator Room",
        "club_type": "community",
        "country": "China",
        "contact": "cn.startup.jbnu@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gCnStartup",
    },

    # ── 🇻🇳  VIETNAM ─────────────────────────────────────────────────────────
    {
        "name": "Vietnamese Student Community — Jeonju",
        "description": (
            "Tết Nguyên Đán celebrations, bánh mì & phở cooking nights, visa guidance, "
            "and scholarship tips for Vietnamese students in Jeonju.\n\n"
            "📸 Instagram: @viet_jeonju\n"
            "📘 Facebook: facebook.com/groups/vietnamesejeonju\n"
            "💬 Zalo Group: Vietnamese Students Jeonju"
        ),
        "category": "social",
        "university": "JBNU",
        "meeting_time": "Every Sunday 4:00 PM",
        "location": "Student Union Room 205",
        "club_type": "community",
        "country": "Vietnam",
        "contact": "viet.jeonju@gmail.com | Zalo: 0342-xxx-xxx",
        "kakao_link": "https://open.kakao.com/o/gVietJeonju",
    },
    {
        "name": "Hội Sinh Viên Việt Nam tại JBNU",
        "description": (
            "The official Vietnamese Students' Association at JBNU. Academic support, "
            "Korean language study groups, cultural performances, and monthly member meetings.\n\n"
            "📸 Instagram: @hsvvn_jbnu\n"
            "📘 Facebook: facebook.com/hsvvnjbnu\n"
            "💬 Zalo: HSVVN JBNU 2024"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every 1st Saturday 3:00 PM",
        "location": "International House, Room 104",
        "club_type": "community",
        "country": "Vietnam",
        "contact": "hsvvn.jbnu@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gHSVVNjbnu",
    },
    {
        "name": "Vietnam–Korea Friendship Club",
        "description": (
            "Bridging Vietnamese and Korean students through language exchange, "
            "K-pop dance covers, Vietnamese cooking tutorials, and cultural workshops. All welcome!\n\n"
            "📸 Instagram: @vietkorea_jbnu\n"
            "📘 Facebook: facebook.com/vietkorea.jbnu"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every Wednesday 5:30 PM",
        "location": "Culture Center Room 202",
        "club_type": "community",
        "country": "Vietnam",
        "contact": "vietkorea.friendship@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gVietKorea",
    },
    {
        "name": "Vietnamese Scholars & Graduate Network",
        "description": (
            "For Vietnamese graduate students, PhD candidates, and researchers at JBNU. "
            "Research collaboration, thesis support, Korean industry connections, and career mentorship.\n\n"
            "📸 Instagram: @vietgrad_jbnu\n"
            "💬 Telegram: t.me/vietgrad_jbnu"
        ),
        "category": "academic",
        "university": "JBNU",
        "meeting_time": "Every 2nd Friday 6:00 PM",
        "location": "Postgraduate Commons Room",
        "club_type": "community",
        "country": "Vietnam",
        "contact": "vietgrad.jbnu@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gVietGrad",
    },
    {
        "name": "Jeonju Vietnamese Food & Culture Circle",
        "description": (
            "Monthly Vietnamese cooking nights, food tours of Jeonju market, "
            "áo dài fashion shows, and Vietnamese music evenings. Open to everyone!\n\n"
            "📸 Instagram: @jeonju_vietfood\n"
            "📘 Facebook: facebook.com/groups/jeonjuvietfood"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every 3rd Saturday 2:00 PM",
        "location": "Student Dining Hall B",
        "club_type": "community",
        "country": "Vietnam",
        "contact": "jeonjuvietfood@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gVietFood",
    },

    # ── 🇲🇳  MONGOLIA ─────────────────────────────────────────────────────────
    {
        "name": "Mongolian Students Association Korea (MSAK)",
        "description": (
            "Supporting Mongolian students with Tsagaan Sar (Lunar New Year), Naadam Festival, "
            "TOPIK prep, and academic-legal guidance across Jeonju.\n\n"
            "📸 Instagram: @msak_korea\n"
            "📘 Facebook: facebook.com/MSAKorea\n"
            "💬 Telegram: t.me/msak_official"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every Saturday 2:00 PM",
        "location": "Global Lounge B1",
        "club_type": "community",
        "country": "Mongolia",
        "contact": "msak.korea@gmail.com | Tel: +82-10-4422-9876",
        "kakao_link": "https://open.kakao.com/o/gMSAKorea",
    },
    {
        "name": "JBNU Mongolian Community",
        "description": (
            "The JBNU chapter for Mongolian students. Weekly meetups, Korean bureaucracy guidance "
            "(immigration, health insurance, banking), and monthly cultural dinner nights.\n\n"
            "📸 Instagram: @mongol_jbnu\n"
            "💬 Telegram: t.me/mongol_jbnu"
        ),
        "category": "social",
        "university": "JBNU",
        "meeting_time": "Every Friday 5:00 PM",
        "location": "International House Lobby",
        "club_type": "community",
        "country": "Mongolia",
        "contact": "mongol.jbnu@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gMongolJBNU",
    },
    {
        "name": "Mongolian Language & Culture Exchange",
        "description": (
            "Mongolian language lessons for beginners, Korean–Mongolian language pairs, "
            "traditional Mongolian throat singing (Khoomei) demos, and folklore nights.\n\n"
            "📸 Instagram: @mongol_culture_korea\n"
            "📘 Facebook: facebook.com/mongolculturekorea"
        ),
        "category": "language",
        "university": "JBNU",
        "meeting_time": "Every Wednesday 6:30 PM",
        "location": "Humanities Building Room 105",
        "club_type": "community",
        "country": "Mongolia",
        "contact": "mongol.culture.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gMongolCulture",
    },
    {
        "name": "Mongolian Wrestling & Sports Club — Jeonju",
        "description": (
            "Bökh (Mongolian wrestling) demonstrations, traditional archery, soccer matches, "
            "and indoor sports nights for Mongolian students and curious Korean friends.\n\n"
            "📸 Instagram: @mongol_sports_jeonju"
        ),
        "category": "sports",
        "university": "JBNU",
        "meeting_time": "Every Saturday 10:00 AM",
        "location": "Sports Complex Field A",
        "club_type": "community",
        "country": "Mongolia",
        "contact": "mongol.sports.jeonju@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gMongolSports",
    },
    {
        "name": "Mongol Graduate & Research Network",
        "description": (
            "PhD and master's students from Mongolia at JBNU and nearby universities. "
            "Research collab, Korean industry tours, and scholarship application support.\n\n"
            "💬 Telegram: t.me/mongol_grad_korea\n"
            "📸 Instagram: @mongol_grad_korea"
        ),
        "category": "academic",
        "university": "JBNU",
        "meeting_time": "Every 1st Thursday 6:00 PM",
        "location": "Graduate Research Center",
        "club_type": "community",
        "country": "Mongolia",
        "contact": "mongol.grad.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gMongolGrad",
    },

    # ── 🇳🇵  NEPAL ────────────────────────────────────────────────────────────
    {
        "name": "Nepali Students Society Korea (NSS Korea)",
        "description": (
            "Dashain, Tihar, Holi celebrations, and community support for Nepali students "
            "navigating Korean visa, banking, and accommodation.\n\n"
            "📸 Instagram: @nss_korea\n"
            "📘 Facebook: facebook.com/NSSKorea\n"
            "💬 Viber Community: NSS Korea Official"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every 2nd Saturday 3:00 PM",
        "location": "Student Center Room 301",
        "club_type": "community",
        "country": "Nepal",
        "contact": "nss.korea.jbnu@gmail.com | Viber: +82-10-6611-2233",
        "kakao_link": "https://open.kakao.com/o/gNSSKorea",
    },
    {
        "name": "JBNU Nepali Students Group",
        "description": (
            "JBNU-specific chapter for Nepali undergrads and postgrads. Course selection help, "
            "TOPIK study group, halal/vegetarian food spots in Jeonju, and weekly chai chats.\n\n"
            "📸 Instagram: @nepali_jbnu\n"
            "💬 Telegram: t.me/nepali_jbnu"
        ),
        "category": "social",
        "university": "JBNU",
        "meeting_time": "Every Sunday 3:00 PM",
        "location": "International House Room 106",
        "club_type": "community",
        "country": "Nepal",
        "contact": "nepali.jbnu@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gNepaliJBNU",
    },
    {
        "name": "Nepal–Korea Cultural Exchange Society",
        "description": (
            "Promoting Nepali art, handicrafts, and music in Korea. Thangka painting workshops, "
            "Nepali cooking classes (dal bhat, momos), and trekking culture nights.\n\n"
            "📸 Instagram: @nepal_korea_culture\n"
            "📘 Facebook: facebook.com/nepalkorea.culture"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every Friday 5:00 PM",
        "location": "Culture Center Gallery Room",
        "club_type": "community",
        "country": "Nepal",
        "contact": "nepalkorea.culture@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gNepalKorea",
    },
    {
        "name": "Nepali IT & Engineering Students Korea",
        "description": (
            "For Nepali students in STEM fields. Coding meetups, Korean tech company tours, "
            "hackathon team formation, and career prep for Korean tech jobs.\n\n"
            "💬 Telegram: t.me/nepali_tech_korea\n"
            "🌐 GitHub: github.com/nepali-tech-korea"
        ),
        "category": "tech",
        "university": "JBNU",
        "meeting_time": "Every Tuesday 7:00 PM",
        "location": "Engineering Building Lab 3",
        "club_type": "community",
        "country": "Nepal",
        "contact": "nepali.tech.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gNepaliTech",
    },
    {
        "name": "Himalayan Buddhist & Meditation Circle",
        "description": (
            "Meditation sessions, Buddhist philosophy discussions, and mindfulness practices "
            "from the Himalayan tradition. Open to all faiths and backgrounds.\n\n"
            "📸 Instagram: @himalayan_meditation_jeonju"
        ),
        "category": "social",
        "university": "JBNU",
        "meeting_time": "Every Thursday 7:00 PM",
        "location": "Student Wellness Center Room 2",
        "club_type": "community",
        "country": "Nepal",
        "contact": "himalayan.meditation.jeonju@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gHimalayanMed",
    },

    # ── 🇮🇩  INDONESIA ───────────────────────────────────────────────────────
    {
        "name": "PPI Jeonju — Perhimpunan Pelajar Indonesia",
        "description": (
            "Official Indonesian student association in Jeonju. Indonesian Independence Day (17 Aug), "
            "rendang & nasi goreng nights, scholarship guidance, and visa support.\n\n"
            "📸 Instagram: @ppijeonju\n"
            "📘 Facebook: facebook.com/ppijeonju\n"
            "🌐 Website: ppijeonju.org"
        ),
        "category": "social",
        "university": "JBNU",
        "meeting_time": "Every 1st Sunday 3:00 PM",
        "location": "International House Lobby",
        "club_type": "community",
        "country": "Indonesia",
        "contact": "ppijeonju@gmail.com | WhatsApp: +82-10-3344-5566",
        "kakao_link": "https://open.kakao.com/o/gPPIJeonju",
    },
    {
        "name": "PPI Korea — Jeonju Chapter Network",
        "description": (
            "Connected to the national PPI Korea network. Academic competitions, internship referrals, "
            "Korean language immersion programs, and the annual PPI Korea Congress.\n\n"
            "📸 Instagram: @ppikorea\n"
            "🌐 Website: ppikorea.org\n"
            "📘 Facebook: facebook.com/PPIKorea"
        ),
        "category": "academic",
        "university": "JBNU",
        "meeting_time": "Every 2nd Saturday 2:00 PM",
        "location": "Student Union Meeting Room A",
        "club_type": "community",
        "country": "Indonesia",
        "contact": "jeonju@ppikorea.org",
        "kakao_link": "https://open.kakao.com/o/gPPIKorea",
    },
    {
        "name": "Indonesian Muslim Community — Jeonju",
        "description": (
            "Halal food directory, Jumuah gathering info, Ramadan iftar events, and Eid celebrations "
            "for Indonesian Muslim students. All Muslim students in Jeonju welcome.\n\n"
            "📸 Instagram: @imc_jeonju\n"
            "💬 WhatsApp Group: Indonesian Muslim Jeonju"
        ),
        "category": "social",
        "university": "JBNU",
        "meeting_time": "Every Friday after prayers",
        "location": "Jeonju Islamic Prayer Room",
        "club_type": "community",
        "country": "Indonesia",
        "contact": "imc.jeonju@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gIndonesianMuslim",
    },
    {
        "name": "Indonesian Culinary & Arts Collective",
        "description": (
            "Monthly Indonesian cooking workshops (batik, wayang, gamelan), street food pop-ups, "
            "and Indonesian cultural performances at JBNU festivals.\n\n"
            "📸 Instagram: @indonesia_arts_jbnu\n"
            "📘 Facebook: facebook.com/indonesiaartsjbnu"
        ),
        "category": "arts",
        "university": "JBNU",
        "meeting_time": "Every 3rd Saturday 3:00 PM",
        "location": "Arts Center Studio B",
        "club_type": "community",
        "country": "Indonesia",
        "contact": "indonesia.arts.jbnu@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gIndonesianArts",
    },
    {
        "name": "Indonesian Tech & Innovation Hub",
        "description": (
            "Indonesian students in computer science, engineering, and business. "
            "Startup ideathons, Google/Samsung Korea tours, and mentoring from Indonesian-Korean alumni.\n\n"
            "📸 Instagram: @indotech_jbnu\n"
            "💬 Telegram: t.me/indotech_korea"
        ),
        "category": "tech",
        "university": "JBNU",
        "meeting_time": "Every Tuesday 6:30 PM",
        "location": "Innovation Lab, Business Building",
        "club_type": "community",
        "country": "Indonesia",
        "contact": "indotech.jbnu@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gIndoTech",
    },

    # ── 🌍  AFRICA (Pan-African) ──────────────────────────────────────────────
    {
        "name": "Nigerian & African Students Association Korea (NASK)",
        "description": (
            "Pan-African community at JBNU. Afrobeats nights, Jollof cookoffs, African cultural exchange, "
            "academic mutual aid, and networking with Korean companies.\n\n"
            "📸 Instagram: @nask_korea\n"
            "📘 Facebook: facebook.com/NASKorea\n"
            "💬 WhatsApp: +82-10-7788-1234"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every 1st Saturday 5:00 PM",
        "location": "Multicultural Room A",
        "club_type": "community",
        "country": "Nigeria",
        "contact": "nask.korea@gmail.com | WhatsApp: +82-10-7788-1234",
        "kakao_link": "https://open.kakao.com/o/gNASKorea",
    },
    {
        "name": "African Students Community Korea (AFSK)",
        "description": (
            "Connecting students from Ghana, Cameroon, Kenya, Ethiopia, Zimbabwe, Tanzania and beyond. "
            "African Union Day, cultural potlucks, and Korean workplace integration workshops.\n\n"
            "📸 Instagram: @afsk_official\n"
            "📘 Facebook: facebook.com/AFSKorea\n"
            "🌐 Website: afskkorea.org"
        ),
        "category": "social",
        "university": "JBNU",
        "meeting_time": "Every 3rd Saturday 4:00 PM",
        "location": "International House B102",
        "club_type": "community",
        "country": "Nigeria",
        "contact": "afsk.official@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gAFSKorea",
    },
    {
        "name": "West African Cultural Circle — Jeonju",
        "description": (
            "Celebrating West African cultures: Nigeria, Ghana, Senegal, Côte d'Ivoire, and more. "
            "Ankara fashion shows, highlife & afrobeats dance workshops, and African film screenings.\n\n"
            "📸 Instagram: @westafrica_jeonju\n"
            "📘 Facebook: facebook.com/groups/westafrica.jeonju"
        ),
        "category": "arts",
        "university": "JBNU",
        "meeting_time": "Every Friday 6:00 PM",
        "location": "Arts Center Main Hall",
        "club_type": "community",
        "country": "Nigeria",
        "contact": "westafrica.jeonju@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gWestAfrica",
    },
    {
        "name": "East African Students Network — Korea",
        "description": (
            "For students from Kenya, Ethiopia, Uganda, Tanzania, Rwanda, and Somalia. "
            "Swahili language club, Ethiopian coffee ceremonies, and inter-African cultural nights.\n\n"
            "📸 Instagram: @eastafrica_korea\n"
            "💬 WhatsApp Group: East Africa Korea Network"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every 2nd Sunday 3:00 PM",
        "location": "Student Union Room 208",
        "club_type": "community",
        "country": "Nigeria",
        "contact": "eastafrica.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gEastAfricaKorea",
    },
    {
        "name": "African STEM Network Korea",
        "description": (
            "Science, technology, engineering, and math network for African students in Korea. "
            "Research partnerships, Korean startup mentoring, and STEM scholarship database.\n\n"
            "📸 Instagram: @african_stem_korea\n"
            "💬 Telegram: t.me/african_stem_korea\n"
            "🌐 LinkedIn: linkedin.com/company/african-stem-korea"
        ),
        "category": "tech",
        "university": "JBNU",
        "meeting_time": "Every Thursday 6:00 PM",
        "location": "Engineering Building Room 210",
        "club_type": "community",
        "country": "Nigeria",
        "contact": "african.stem.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gAfricanSTEM",
    },

    # ── 🇷🇺  RUSSIA & CIS ─────────────────────────────────────────────────────
    {
        "name": "Russian-Speaking Students Club — Jeonju",
        "description": (
            "Community for students from Russia, Kazakhstan, Belarus, Kyrgyzstan, and other CIS countries. "
            "Language exchange, movie nights, Soviet nostalgia cooking, and holiday celebrations.\n\n"
            "📸 Instagram: @rus_jeonju\n"
            "💬 Telegram: t.me/russian_jeonju\n"
            "📘 VK: vk.com/russian_jeonju"
        ),
        "category": "social",
        "university": "JBNU",
        "meeting_time": "Every Thursday 6:30 PM",
        "location": "Humanitas Hall Room 108",
        "club_type": "community",
        "country": "Russia",
        "contact": "russian.jeonju@gmail.com | Telegram: @russian_jeonju_admin",
        "kakao_link": "https://open.kakao.com/o/gRussianJeonju",
    },
    {
        "name": "CIS Students Union Korea",
        "description": (
            "Uniting students from all 11 CIS countries in Korea. New Year (Novy God), "
            "Maslenitsa, and Victory Day events. Academic and legal guidance across all Korean universities.\n\n"
            "📸 Instagram: @cis_union_korea\n"
            "💬 Telegram: t.me/cis_students_korea"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every 2nd Saturday 4:00 PM",
        "location": "Global Lounge, 1st Floor",
        "club_type": "community",
        "country": "Russia",
        "contact": "cis.union.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gCISunion",
    },
    {
        "name": "Russian Language & Literature Circle",
        "description": (
            "Pushkin to Dostoevsky — Russian literature discussion group, language tutoring "
            "for Korean students, and Russian cinema screenings with Korean subtitles.\n\n"
            "📸 Instagram: @russian_lit_korea\n"
            "💬 Telegram: t.me/russian_lit_jeonju"
        ),
        "category": "language",
        "university": "JBNU",
        "meeting_time": "Every Monday 6:00 PM",
        "location": "Humanities Building Room 301",
        "club_type": "community",
        "country": "Russia",
        "contact": "russian.lit.jeonju@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gRussianLit",
    },
    {
        "name": "Russian & CIS Sports Club — Jeonju",
        "description": (
            "Sambo, chess, volleyball, and football games for Russian and CIS students. "
            "Annual Winter Sports Day with ice skating and indoor games tournament.\n\n"
            "📸 Instagram: @cis_sports_jeonju\n"
            "💬 Telegram: t.me/cis_sports_jeonju"
        ),
        "category": "sports",
        "university": "JBNU",
        "meeting_time": "Every Saturday 11:00 AM",
        "location": "Sports Complex, Indoor Hall",
        "club_type": "community",
        "country": "Russia",
        "contact": "cis.sports.jeonju@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gCISSports",
    },
    {
        "name": "Slavic & CIS Academic Network Korea",
        "description": (
            "Research collaboration, Korean scholarship guidance, and professional networking "
            "for Russian, Ukrainian, Belarusian, and CIS scholars at Korean universities.\n\n"
            "💬 Telegram: t.me/slavic_academic_korea\n"
            "🌐 LinkedIn: linkedin.com/company/slavic-academic-korea"
        ),
        "category": "academic",
        "university": "JBNU",
        "meeting_time": "Every 1st Friday 5:30 PM",
        "location": "Graduate Research Center",
        "club_type": "community",
        "country": "Russia",
        "contact": "slavic.academic.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gSlavicAcademic",
    },

    # ── 🇮🇳  INDIA ────────────────────────────────────────────────────────────
    {
        "name": "Indian Students Association Korea (ISAK — Jeonju)",
        "description": (
            "Diwali, Holi, Eid-ul-Fitr, and Onam celebrations. Biryani potlucks, cricket on weekends, "
            "and a strong academic support network for Indian students at JBNU.\n\n"
            "📸 Instagram: @isak_jeonju\n"
            "📘 Facebook: facebook.com/ISAKJeonju\n"
            "🌐 Website: isakkorea.org"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every Sunday 2:00 PM",
        "location": "Student Union Room 210",
        "club_type": "community",
        "country": "India",
        "contact": "isak.jeonju@gmail.com | WhatsApp: +82-10-9900-1122",
        "kakao_link": "https://open.kakao.com/o/gISAKjeonju",
    },
    {
        "name": "Bharatiya Vidyarthi Parishad Korea (BVP Korea)",
        "description": (
            "Cultural and intellectual discussions rooted in Indian philosophy, "
            "Yoga & Ayurveda wellness sessions, classical Indian music performances, "
            "and India Independence Day celebrations.\n\n"
            "📸 Instagram: @bvp_korea\n"
            "📘 Facebook: facebook.com/BVPKorea"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every 1st Sunday 4:00 PM",
        "location": "International House Hall",
        "club_type": "community",
        "country": "India",
        "contact": "bvp.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gBVPkorea",
    },
    {
        "name": "Indian Food & Bollywood Night Club",
        "description": (
            "Monthly Indian cooking classes (butter chicken, paneer tikka, samosas), "
            "Bollywood dance workshops, and Hindi film screenings. All nationalities welcome!\n\n"
            "📸 Instagram: @india_food_jeonju\n"
            "📘 Facebook: facebook.com/indiafoodjeonju"
        ),
        "category": "arts",
        "university": "JBNU",
        "meeting_time": "Every Saturday 3:00 PM",
        "location": "Student Dining Hall A",
        "club_type": "community",
        "country": "India",
        "contact": "india.food.jeonju@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gIndiaFood",
    },
    {
        "name": "India–Korea Cricket Club",
        "description": (
            "Weekly cricket practice and friendly matches among Indian students and curious Korean players. "
            "Annual ISAK Cricket Tournament and participation in Korea Cricket Association events.\n\n"
            "📸 Instagram: @indiakorea_cricket\n"
            "💬 WhatsApp: India-Korea Cricket Jeonju"
        ),
        "category": "sports",
        "university": "JBNU",
        "meeting_time": "Every Saturday & Sunday 9:00 AM",
        "location": "JBNU Sports Field",
        "club_type": "community",
        "country": "India",
        "contact": "indiakorea.cricket@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gIndiaCricket",
    },
    {
        "name": "Indian Scholars & Tech Network Korea",
        "description": (
            "For Indian graduate students and researchers in STEM and business. "
            "Research networking, Korean startup mentoring, IIT/IIM alumni connections, "
            "and career prep for Korean tech companies.\n\n"
            "📸 Instagram: @indian_tech_korea\n"
            "💬 Telegram: t.me/indian_tech_korea\n"
            "🌐 LinkedIn: linkedin.com/company/indian-tech-korea"
        ),
        "category": "tech",
        "university": "JBNU",
        "meeting_time": "Every Friday 6:00 PM",
        "location": "Engineering Building Innovation Hub",
        "club_type": "community",
        "country": "India",
        "contact": "indian.tech.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gIndianTech",
    },

    # ── 🇰🇿  KAZAKHSTAN & CENTRAL ASIA ───────────────────────────────────────
    {
        "name": "Kazakh & Central Asian Student Hub",
        "description": (
            "Students from Kazakhstan, Tajikistan, Turkmenistan, and across Central Asia. "
            "Nauryz Festival (March 22), beshbarmak cooking nights, and mutual support network.\n\n"
            "📸 Instagram: @centralasia_jbnu\n"
            "💬 Telegram: t.me/centralasia_jbnu\n"
            "📘 Facebook: facebook.com/CentralAsiaJBNU"
        ),
        "category": "social",
        "university": "JBNU",
        "meeting_time": "Every Saturday 4:00 PM",
        "location": "Global Lounge 2nd Floor",
        "club_type": "community",
        "country": "Kazakhstan",
        "contact": "centralasia.jbnu@gmail.com | Telegram: @centralasia_jbnu_admin",
        "kakao_link": "https://open.kakao.com/o/gCentralAsiaHub",
    },
    {
        "name": "Kazakh Students Association Korea (KASAK)",
        "description": (
            "National-level organization for Kazakhstani students in Korea. "
            "Nauryz Gala, Kazakh National Day, scholarship info, and alumni mentorship.\n\n"
            "📸 Instagram: @kasak_official\n"
            "🌐 Website: kasak-korea.kz\n"
            "💬 Telegram: t.me/kasak_official"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every 1st Saturday 3:00 PM",
        "location": "International House Hall B",
        "club_type": "community",
        "country": "Kazakhstan",
        "contact": "kasak.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gKASAKorea",
    },
    {
        "name": "Tajik & Kyrgyz Students Community — Korea",
        "description": (
            "Nowruz celebrations, Kyrgyz/Tajik language tutoring, "
            "traditional plov & shurpa cooking events, and student solidarity network.\n\n"
            "📸 Instagram: @tajik_kyrgyz_korea\n"
            "💬 Telegram: t.me/tajik_kyrgyz_korea"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every 3rd Saturday 4:00 PM",
        "location": "Student Union Room 302",
        "club_type": "community",
        "country": "Kazakhstan",
        "contact": "tajik.kyrgyz.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gTajikKyrgyz",
    },
    {
        "name": "Central Asian Business & Tech Network",
        "description": (
            "Connecting Central Asian students in business, engineering, and tech. "
            "Korean startup tours, job placement in Korean-CIS companies, and entrepreneurship bootcamps.\n\n"
            "📸 Instagram: @ca_biz_korea\n"
            "💬 Telegram: t.me/ca_biz_korea"
        ),
        "category": "tech",
        "university": "JBNU",
        "meeting_time": "Every Wednesday 7:00 PM",
        "location": "Business Building Seminar Room 2",
        "club_type": "community",
        "country": "Kazakhstan",
        "contact": "ca.biz.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gCABizKorea",
    },
    {
        "name": "Steppe & Silk Road Cultural Society",
        "description": (
            "Celebrating the nomadic heritage of Central Asia through art, music, "
            "traditional games (kok-boru, toguz korgool), and the ancient Silk Road trade stories.\n\n"
            "📸 Instagram: @silkroad_korea\n"
            "📘 Facebook: facebook.com/silkroadkorea"
        ),
        "category": "arts",
        "university": "JBNU",
        "meeting_time": "Every Sunday 3:00 PM",
        "location": "Arts Center Hall A",
        "club_type": "community",
        "country": "Kazakhstan",
        "contact": "silkroad.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gSilkRoad",
    },

    # ── 🌎  LATIN AMERICA ─────────────────────────────────────────────────────
    {
        "name": "Latin American & Spanish-Speaking Students",
        "description": (
            "Bringing together students from Mexico, Colombia, Brazil, Peru, Chile, Argentina and beyond. "
            "Salsa & bachata dance classes, empanada nights, and Día de los Muertos celebrations.\n\n"
            "📸 Instagram: @latinos_jbnu\n"
            "📘 Facebook: facebook.com/latinosjbnu\n"
            "💬 WhatsApp: Latino Students JBNU"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every Friday 7:00 PM",
        "location": "Student Union Room 206",
        "club_type": "community",
        "country": "Latin America",
        "contact": "latinos.jbnu@gmail.com | WhatsApp: +82-10-5566-7788",
        "kakao_link": "https://open.kakao.com/o/gLatinJBNU",
    },
    {
        "name": "Korean–Latin Music & Dance Club",
        "description": (
            "Merging K-pop with salsa, reggaeton, and Latin beats. "
            "Weekly dance workshops, live DJ nights, and annual Latin-Korean Music Festival at JBNU.\n\n"
            "📸 Instagram: @klatinmusic_jbnu\n"
            "📘 Facebook: facebook.com/klatinmusicjbnu"
        ),
        "category": "arts",
        "university": "JBNU",
        "meeting_time": "Every Saturday 6:00 PM",
        "location": "Student Hall Performance Room A",
        "club_type": "community",
        "country": "Latin America",
        "contact": "klatinmusic.jbnu@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gKLatinMusic",
    },
    {
        "name": "Brazilian Students & Lusophone Community",
        "description": (
            "For students from Brazil, Portugal, Angola, Mozambique, and Cape Verde. "
            "Capoeira workshops, Brazilian BBQ (churrasco) nights, and Portuguese language exchange.\n\n"
            "📸 Instagram: @brazilian_jbnu\n"
            "📘 Facebook: facebook.com/brazilianjbnu"
        ),
        "category": "social",
        "university": "JBNU",
        "meeting_time": "Every 2nd Saturday 5:00 PM",
        "location": "Sports Complex B — Capoeira Corner",
        "club_type": "community",
        "country": "Latin America",
        "contact": "brazilian.jbnu@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gBrazilianJBNU",
    },
    {
        "name": "Spanish Language Exchange Korea",
        "description": (
            "Spanish ↔ Korean language partners, conversation clubs, and group DELE exam prep. "
            "Open to anyone learning Spanish or wanting to practise with native speakers.\n\n"
            "📸 Instagram: @spanish_korea_exchange\n"
            "💬 Telegram: t.me/spanish_korea_exchange"
        ),
        "category": "language",
        "university": "JBNU",
        "meeting_time": "Every Wednesday 6:00 PM",
        "location": "Humanities Building Room 207",
        "club_type": "community",
        "country": "Latin America",
        "contact": "spanish.exchange.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gSpanishExchange",
    },
    {
        "name": "Latino Entrepreneurs Korea Network",
        "description": (
            "Latin American students interested in Korean business and tech. "
            "Startup incubator visits, networking with Korean-Latin trade chambers, and pitch practice.\n\n"
            "📸 Instagram: @latino_biz_korea\n"
            "🌐 LinkedIn: linkedin.com/company/latino-entrepreneurs-korea"
        ),
        "category": "tech",
        "university": "JBNU",
        "meeting_time": "Every 1st Friday 6:00 PM",
        "location": "Business School Coworking Space",
        "club_type": "community",
        "country": "Latin America",
        "contact": "latino.biz.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gLatinoBizKorea",
    },

    # ── 🕌  MIDDLE EAST & ARAB ────────────────────────────────────────────────
    {
        "name": "Arab & Middle Eastern Students — JBNU",
        "description": (
            "Students from Saudi Arabia, UAE, Jordan, Egypt, Morocco, Lebanon, Iraq, Syria, and beyond. "
            "Ramadan iftars, Arabic calligraphy, halal food map of Jeonju, and Eid gatherings.\n\n"
            "📸 Instagram: @arab_jbnu\n"
            "💬 WhatsApp: Arab Students JBNU\n"
            "📘 Facebook: facebook.com/arabjbnu"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every Thursday 5:30 PM",
        "location": "International House Room 103",
        "club_type": "community",
        "country": "Middle East",
        "contact": "arab.jbnu@gmail.com | WhatsApp: +82-10-6677-3344",
        "kakao_link": "https://open.kakao.com/o/gArabJBNU",
    },
    {
        "name": "Muslim International Students Society — Jeonju",
        "description": (
            "Open to Muslim students of all nationalities. Friday prayers info, halal certification "
            "guide for Jeonju restaurants, Quran study circles, and monthly communal iftars.\n\n"
            "📸 Instagram: @muslim_jeonju\n"
            "💬 Telegram: t.me/muslim_jeonju\n"
            "📘 Facebook: facebook.com/MuslimJeonju"
        ),
        "category": "social",
        "university": "JBNU",
        "meeting_time": "Every Friday 1:00 PM",
        "location": "Jeonju Islamic Cultural Center",
        "club_type": "community",
        "country": "Middle East",
        "contact": "muslim.jeonju@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gMuslimJeonju",
    },
    {
        "name": "Korean–Arabic Language Exchange",
        "description": (
            "Arabic ↔ Korean language partners and conversation sessions. "
            "Arabic calligraphy workshops, Arabic food nights, and Korean drama translation practice.\n\n"
            "📸 Instagram: @arabic_korean_exchange\n"
            "💬 Telegram: t.me/arabic_korean_exchange"
        ),
        "category": "language",
        "university": "JBNU",
        "meeting_time": "Every Tuesday 5:30 PM",
        "location": "Humanities Building Language Lab",
        "club_type": "community",
        "country": "Middle East",
        "contact": "arabic.korean.exchange@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gArabicKorean",
    },
    {
        "name": "Iranian & Persian Cultural Society Korea",
        "description": (
            "Celebrating Nowruz (Persian New Year), Yalda Night, and Persian poetry with Hafez & Rumi. "
            "Persian cooking (ghormeh sabzi, tahdig), and cultural exchange with Korean students.\n\n"
            "📸 Instagram: @persian_culture_korea\n"
            "💬 Telegram: t.me/persian_korea"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every 2nd Saturday 5:00 PM",
        "location": "Culture Center Room 303",
        "club_type": "community",
        "country": "Middle East",
        "contact": "persian.culture.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gPersianKorea",
    },
    {
        "name": "Gulf Students Network Korea",
        "description": (
            "Students from Saudi Arabia, UAE, Kuwait, Qatar, Bahrain, and Oman. "
            "Arabic coffee ceremonies, Arabic calligraphy, and Gulf cuisine pop-ups.\n\n"
            "📸 Instagram: @gulf_students_korea\n"
            "💬 WhatsApp: Gulf Students Korea Network"
        ),
        "category": "social",
        "university": "JBNU",
        "meeting_time": "Every 3rd Friday 5:00 PM",
        "location": "Global Lounge VIP Room",
        "club_type": "community",
        "country": "Middle East",
        "contact": "gulf.students.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gGulfKorea",
    },

    # ── 🇹🇷  TURKEY ──────────────────────────────────────────────────────────
    {
        "name": "Turkish Students Association Korea",
        "description": (
            "For Turkish students across South Korea. Republic Day celebrations (Oct 29), "
            "Turkish cooking nights (baklava, köfte), language exchange, and scholarship guidance.\n\n"
            "📸 Instagram: @turk_korea\n"
            "💬 Telegram: t.me/turk_students_korea\n"
            "📘 Facebook: facebook.com/TurkishStudentsKorea"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every 2nd Saturday 4:00 PM",
        "location": "International House Room 201",
        "club_type": "community",
        "country": "Turkey",
        "contact": "turk.korea@gmail.com | Telegram: @turk_korea_admin",
        "kakao_link": "https://open.kakao.com/o/gTurkKorea",
    },
    {
        "name": "JBNU Turkish & Eurasian Community",
        "description": (
            "Turkish, Azerbaijani, and Turkic-speaking students at JBNU. "
            "Nowruz & Republic Day events, Turkish language tutoring for Koreans, and cultural food nights.\n\n"
            "📸 Instagram: @turk_jbnu\n"
            "💬 Telegram: t.me/turk_jbnu"
        ),
        "category": "social",
        "university": "JBNU",
        "meeting_time": "Every Friday 5:00 PM",
        "location": "Student Union Room 304",
        "club_type": "community",
        "country": "Turkey",
        "contact": "turk.jbnu@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gTurkJBNU",
    },
    {
        "name": "Turkish–Korean Friendship Society",
        "description": (
            "Korea and Turkey have a historic 'brotherly nation' bond. "
            "This club celebrates it through cultural exchanges, language pairs, "
            "and Korean-Turkish cuisine fusion events.\n\n"
            "📸 Instagram: @turkkorea_friendship\n"
            "📘 Facebook: facebook.com/TurkKoreaFriendship"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every Wednesday 6:00 PM",
        "location": "Culture Center Main Room",
        "club_type": "community",
        "country": "Turkey",
        "contact": "turkkorea.friendship@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gTurkKoreaFriend",
    },
    {
        "name": "Turkish Music & Saz Club Korea",
        "description": (
            "Turkish classical music (saz/baglama), folk music, and Ottoman musical heritage. "
            "Weekly practice sessions, performances at JBNU International Day, and music lessons.\n\n"
            "📸 Instagram: @saz_korea\n"
            "💬 Telegram: t.me/saz_korea"
        ),
        "category": "arts",
        "university": "JBNU",
        "meeting_time": "Every Tuesday 7:00 PM",
        "location": "Arts Center Music Studio",
        "club_type": "community",
        "country": "Turkey",
        "contact": "saz.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gSazKorea",
    },
    {
        "name": "Türk Girişimciler Kore (Turkish Entrepreneurs Korea)",
        "description": (
            "Turkish students in business, engineering, and tech connecting with Korea's startup ecosystem. "
            "Silicon Valley of Asia tours, VC meetups, and Turkish-Korean trade networking.\n\n"
            "📸 Instagram: @turk_startup_korea\n"
            "🌐 LinkedIn: linkedin.com/company/turk-girisimc-korea"
        ),
        "category": "tech",
        "university": "JBNU",
        "meeting_time": "Every 1st Thursday 6:30 PM",
        "location": "Business School Innovation Room",
        "club_type": "community",
        "country": "Turkey",
        "contact": "turk.startup.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gTurkStartup",
    },

    # ── 🇧🇩  BANGLADESH ──────────────────────────────────────────────────────
    {
        "name": "Bangladeshi Students Association Korea (BSAK)",
        "description": (
            "Eid, Eid-ul-Adha, Pohela Boishakh (Bengali New Year) celebrations. "
            "Scholarship guidance, halal food network, and academic support for Bangladeshi students.\n\n"
            "📸 Instagram: @bsak_korea\n"
            "📘 Facebook: facebook.com/BSAKorea\n"
            "💬 WhatsApp: BSAK Official Group"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every Saturday 4:00 PM",
        "location": "International House Room 105",
        "club_type": "community",
        "country": "Bangladesh",
        "contact": "bsak.korea@gmail.com | WhatsApp: +82-10-8899-2211",
        "kakao_link": "https://open.kakao.com/o/gBSAKorea",
    },
    {
        "name": "JBNU Bangladeshi Community",
        "description": (
            "JBNU-specific group for Bangladeshi undergrads and graduate students. "
            "Course help, TOPIK study, and biryani cookoffs every Eid.\n\n"
            "📸 Instagram: @bangladeshi_jbnu\n"
            "💬 Telegram: t.me/bangladeshi_jbnu"
        ),
        "category": "social",
        "university": "JBNU",
        "meeting_time": "Every Sunday 3:00 PM",
        "location": "Student Union Room 104",
        "club_type": "community",
        "country": "Bangladesh",
        "contact": "bangladeshi.jbnu@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gBangladeshiJBNU",
    },
    {
        "name": "Bengal Tech Network Korea",
        "description": (
            "Bangladeshi and West Bengali students in STEM. Hackathons, open-source contributions, "
            "and Korean tech company internship referrals.\n\n"
            "📸 Instagram: @bengaltech_korea\n"
            "💬 Telegram: t.me/bengaltech_korea"
        ),
        "category": "tech",
        "university": "JBNU",
        "meeting_time": "Every Thursday 7:00 PM",
        "location": "Engineering Lab Room 5",
        "club_type": "community",
        "country": "Bangladesh",
        "contact": "bengaltech.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gBengalTech",
    },
    {
        "name": "Bengali Language & Literature Korea",
        "description": (
            "Rabindranath Tagore and Nazrul Islam poetry, Bengali calligraphy, Rabindra Sangeet music, "
            "and Pohela Boishakh cultural programs. Open to all language lovers.\n\n"
            "📸 Instagram: @bengali_lit_korea\n"
            "📘 Facebook: facebook.com/bengalilitkorea"
        ),
        "category": "language",
        "university": "JBNU",
        "meeting_time": "Every Monday 6:30 PM",
        "location": "Humanities Building Room 206",
        "club_type": "community",
        "country": "Bangladesh",
        "contact": "bengali.lit.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gBengaliLit",
    },
    {
        "name": "Bangladesh Muslim Students Korea",
        "description": (
            "Halal food guide for Jeonju, prayer schedules, Ramadan iftars, "
            "and Eid ul-Fitr & Eid ul-Adha community gatherings.\n\n"
            "📸 Instagram: @bd_muslim_korea\n"
            "💬 WhatsApp: BD Muslim Students Korea"
        ),
        "category": "social",
        "university": "JBNU",
        "meeting_time": "Every Friday after Jumu'ah",
        "location": "Jeonju Mosque / International House",
        "club_type": "community",
        "country": "Bangladesh",
        "contact": "bd.muslim.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gBDMuslimKorea",
    },

    # ── 🌏  SOUTHEAST ASIA ────────────────────────────────────────────────────
    {
        "name": "ASEAN Students Network Korea",
        "description": (
            "Bringing together students from Thailand, Philippines, Malaysia, Myanmar, "
            "Singapore, Cambodia, Laos, and Brunei. ASEAN Day, Southeast Asian Food Festival, "
            "and inter-university cultural exchange.\n\n"
            "📸 Instagram: @asean_korea\n"
            "📘 Facebook: facebook.com/ASEANStudentsKorea\n"
            "🌐 Website: aseankorea.org"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every 1st Saturday 3:00 PM",
        "location": "International House Hall A",
        "club_type": "community",
        "country": "Southeast Asia",
        "contact": "asean.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gASEANkorea",
    },
    {
        "name": "Thai Students Association Korea (TSAK)",
        "description": (
            "Songkran Water Festival, Loy Krathong lantern nights, Thai cooking classes "
            "(pad thai, tom yum), and Muay Thai demonstration events.\n\n"
            "📸 Instagram: @tsak_korea\n"
            "📘 Facebook: facebook.com/TSAKorea\n"
            "💬 LINE Group: TSAK Official"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every Sunday 4:00 PM",
        "location": "International House Room 202",
        "club_type": "community",
        "country": "Southeast Asia",
        "contact": "tsak.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gTSAKorea",
    },
    {
        "name": "Filipino Students Association Korea (FSAK)",
        "description": (
            "Sinigang potlucks, Paskó Christmas celebrations, Flores de Mayo, and fiesta nights. "
            "Strong OFW support network and peer mentorship for Filipino students in Korea.\n\n"
            "📸 Instagram: @fsak_korea\n"
            "📘 Facebook: facebook.com/FSAKorea\n"
            "💬 Viber: FSAK Community"
        ),
        "category": "social",
        "university": "JBNU",
        "meeting_time": "Every Saturday 3:00 PM",
        "location": "Student Union Room 207",
        "club_type": "community",
        "country": "Southeast Asia",
        "contact": "fsak.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gFSAKorea",
    },
    {
        "name": "Myanmar Students Union Korea",
        "description": (
            "Thingyan (Water Festival) celebrations, Burmese cooking nights (mohinga, laphet thoke), "
            "and mutual support for Myanmar students navigating Korean visa and academic systems.\n\n"
            "📸 Instagram: @myanmar_korea\n"
            "💬 Telegram: t.me/myanmar_students_korea\n"
            "📘 Facebook: facebook.com/MyanmarStudentsKorea"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every 2nd Saturday 3:00 PM",
        "location": "Global Lounge Room 3",
        "club_type": "community",
        "country": "Southeast Asia",
        "contact": "myanmar.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gMyanmarKorea",
    },
    {
        "name": "Southeast Asian Foodies & Culture Club",
        "description": (
            "A melting pot of Southeast Asian cuisines — Malaysian nasi lemak, "
            "Indonesian gado-gado, Thai som tam, Vietnamese pho, and Filipino adobo. "
            "Monthly international food market and fusion cooking competitions.\n\n"
            "📸 Instagram: @sea_food_jeonju\n"
            "📘 Facebook: facebook.com/SEAfoodjeonju"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every Friday 6:00 PM",
        "location": "Student Dining Hall C",
        "club_type": "community",
        "country": "Southeast Asia",
        "contact": "sea.food.jeonju@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gSEAFoodJeonju",
    },

    # ── 🇪🇺  EUROPE ──────────────────────────────────────────────────────────
    {
        "name": "European Students Network — JBNU",
        "description": (
            "Students from France, Germany, Spain, Italy, Poland, Ukraine, Hungary, and beyond. "
            "European Christmas Market, EU Day celebrations, language exchange, and cultural potlucks.\n\n"
            "📸 Instagram: @europe_jbnu\n"
            "📘 Facebook: facebook.com/EuropeJBNU\n"
            "💬 Telegram: t.me/european_jbnu"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every 2nd Friday 6:00 PM",
        "location": "International House Room 203",
        "club_type": "community",
        "country": "Europe",
        "contact": "europe.jbnu@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gEuropeJBNU",
    },
    {
        "name": "French & Francophone Students Korea",
        "description": (
            "For students from France, Belgium, Switzerland, Canada (Québec), Senegal, "
            "and all Francophone countries. Bastille Day, French cinema nights, and croissant baking.\n\n"
            "📸 Instagram: @french_korea_jbnu\n"
            "📘 Facebook: facebook.com/FrenchKoreaJBNU"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every Thursday 6:00 PM",
        "location": "Culture Center Room 204",
        "club_type": "community",
        "country": "Europe",
        "contact": "french.korea.jbnu@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gFrenchKorea",
    },
    {
        "name": "German-Speaking Students Society Korea",
        "description": (
            "For students from Germany, Austria, and Switzerland. "
            "Oktoberfest nights, German board game evenings, Deutschkurs (German tutoring), "
            "and cultural exchange with Korean Germanistik students.\n\n"
            "📸 Instagram: @german_korea_jbnu\n"
            "💬 Telegram: t.me/german_korea_jbnu"
        ),
        "category": "language",
        "university": "JBNU",
        "meeting_time": "Every Wednesday 5:00 PM",
        "location": "Humanities Building Room 208",
        "club_type": "community",
        "country": "Europe",
        "contact": "german.korea.jbnu@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gGermanKorea",
    },
    {
        "name": "Eastern European Students Circle",
        "description": (
            "Students from Poland, Czech Republic, Hungary, Romania, Serbia, Bulgaria, and the Baltics. "
            "Slavic cultural nights, folk music, and Central/Eastern European food festivals.\n\n"
            "📸 Instagram: @ee_students_korea\n"
            "💬 Telegram: t.me/east_europe_korea"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every 3rd Saturday 4:00 PM",
        "location": "Student Union Room 305",
        "club_type": "community",
        "country": "Europe",
        "contact": "ee.students.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gEEStudentsKorea",
    },
    {
        "name": "European Business & Innovation Network Korea",
        "description": (
            "European students in business, finance, and tech. "
            "Korean-EU trade workshops, Samsung/Hyundai internship guidance, and Erasmus alumni talks.\n\n"
            "📸 Instagram: @eu_biz_korea\n"
            "🌐 LinkedIn: linkedin.com/company/european-biz-korea"
        ),
        "category": "tech",
        "university": "JBNU",
        "meeting_time": "Every 1st Thursday 6:00 PM",
        "location": "Business Building Seminar Room 3",
        "club_type": "community",
        "country": "Europe",
        "contact": "eu.biz.korea@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gEUBizKorea",
    },

    # ─────────────────────────────────────────────────────────────────────────
    #  UNIVERSITY CLUBS (non-community)
    # ─────────────────────────────────────────────────────────────────────────
    {
        "name": "JBNU International Hiking Club",
        "description": (
            "Explore Korea's breathtaking mountains! Weekly hikes to Naejangsan, Deogyusan, "
            "Maisan, and overnight trips to Seoraksan. All fitness levels welcome.\n\n"
            "📸 Instagram: @jbnu_hiking\n"
            "💬 KakaoTalk: Open link below"
        ),
        "category": "sports",
        "university": "JBNU",
        "meeting_time": "Every Saturday 7:00 AM",
        "location": "Main Gate Parking Lot",
        "club_type": "club",
        "country": "",
        "contact": "jbnu.hiking@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gJBNUHiking",
    },
    {
        "name": "JBNU K-Pop & Dance Club",
        "description": (
            "Learn K-Pop choreography and perform at JBNU festivals. BTS, BLACKPINK, aespa and more. "
            "Perfect for beginners and experienced dancers.\n\n"
            "📸 Instagram: @jbnu_kpop_dance\n"
            "📘 Facebook: facebook.com/jbnukpopdance"
        ),
        "category": "arts",
        "university": "JBNU",
        "meeting_time": "Tuesday & Thursday 7:00 PM",
        "location": "Student Hall Dance Practice Room B",
        "club_type": "club",
        "country": "",
        "contact": "jbnu.kpop@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gJBNUKpop",
    },
    {
        "name": "Korean Language Exchange Club",
        "description": (
            "1-on-1 and group Korean ↔ English/other language exchange sessions. "
            "TOPIK study groups every month.\n\n"
            "📸 Instagram: @jbnu_langexchange\n"
            "💬 Telegram: t.me/jbnu_topik"
        ),
        "category": "language",
        "university": "JBNU",
        "meeting_time": "Every Wednesday 5:00 PM",
        "location": "Language Lab Room 3, Humanities Building",
        "club_type": "club",
        "country": "",
        "contact": "jbnu.langexchange@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gJBNULang",
    },
    {
        "name": "JBNU Tech & AI Collective",
        "description": (
            "Coding sprints, AI workshops, hackathons, and tech talks from industry speakers. "
            "Build your portfolio and prep for Korean tech company interviews.\n\n"
            "📸 Instagram: @jbnu_tech_ai\n"
            "🌐 GitHub: github.com/jbnu-tech-collective\n"
            "💬 Discord: discord.gg/jbnutech"
        ),
        "category": "tech",
        "university": "JBNU",
        "meeting_time": "Every Tuesday 6:00 PM",
        "location": "Engineering Building Room 404",
        "club_type": "club",
        "country": "",
        "contact": "jbnu.tech.ai@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gJBNUTech",
    },
    {
        "name": "Jeonju Food & Culture Explorers",
        "description": (
            "Discover Korea's food capital! Restaurant tours through the Hanok Village, "
            "makgeolli tastings, bibimbap masterclasses, and seasonal Korean cooking workshops.\n\n"
            "📸 Instagram: @jeonju_food_explorers\n"
            "📘 Facebook: facebook.com/jeonjufoodexplorers"
        ),
        "category": "culture",
        "university": "JBNU",
        "meeting_time": "Every Friday 6:00 PM",
        "location": "Hanok Village South Gate",
        "club_type": "club",
        "country": "",
        "contact": "jeonju.food.explorers@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gJeonjuFood",
    },
]


def seed():
    app = create_app()
    bcrypt = Bcrypt(app)

    with app.app_context():
        # Get or create the ICOM system user
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
        updated = 0
        skipped = 0

        for data in SEED_CLUBS:
            existing = Club.query.filter_by(name=data["name"]).first()
            if existing:
                # Update contact info on existing records
                existing.description  = data["description"]
                existing.contact      = data.get("contact", "")
                existing.kakao_link   = data.get("kakao_link", "")
                existing.meeting_time = data["meeting_time"]
                existing.location     = data["location"]
                existing.country      = data.get("country", "")
                updated += 1
                print(f"  ↻ Updated: {data['name']}")
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
                contact=data.get("contact", ""),
                kakao_link=data.get("kakao_link", ""),
                created_by=admin.id,
                is_active=True,
            )
            db.session.add(club)
            added += 1
            print(f"  ✓ Added: {data['name']}")

        db.session.commit()
        print(f"\nDone! Added {added}, updated {updated}, skipped {skipped} communities/clubs.")


if __name__ == "__main__":
    seed()
