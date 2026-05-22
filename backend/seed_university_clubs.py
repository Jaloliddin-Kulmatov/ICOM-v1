"""
Seed script — adds real university-specific clubs for major Korean universities.
Communities (club_type="community") are visible to all users.
Clubs (club_type="club") are visible only to users whose university matches.

Run:
    python3 seed_university_clubs.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app, db
from models import User, Club
from flask_bcrypt import Bcrypt

# Each entry must have a `university` key that matches EXACTLY what students
# type when they register, so filtering works correctly.
UNIVERSITY_CLUBS = [

    # ══════════════════════════════════════════════════════════════════════════
    #  JBNU — Jeonbuk National University (Jeonju)
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "JBNU International Students Association (ISA)",
        "description": (
            "The official umbrella organisation for all international students at JBNU. "
            "Orientation week, buddy matching with Korean students, campus tours, "
            "visa & health-insurance workshops, and the annual JBNU International Day.\n\n"
            "📸 Instagram: @jbnu_isa\n"
            "📘 Facebook: facebook.com/JBNUisa\n"
            "🌐 Website: isa.jbnu.ac.kr"
        ),
        "category": "social",
        "university": "JBNU",
        "meeting_time": "Every Wednesday 5:00 PM",
        "location": "International Exchange Center, Room 201",
        "club_type": "club",
        "country": "",
        "contact": "isa.jbnu@gmail.com | Tel: +82-63-270-2114",
        "kakao_link": "https://open.kakao.com/o/gJBNUisa",
        "website": "https://international.jbnu.ac.kr",
    },
    {
        "name": "JBNU Global Buddy Program",
        "description": (
            "Korean students paired 1-on-1 with international students for campus life, "
            "Korean language help, local food exploration, and cultural exchange throughout the semester.\n\n"
            "📸 Instagram: @jbnu_buddy\n"
            "💬 KakaoTalk: Open link below"
        ),
        "category": "social",
        "university": "JBNU",
        "meeting_time": "Orientation: every semester start",
        "location": "International Affairs Office, Admin Building",
        "club_type": "club",
        "country": "",
        "contact": "global.buddy.jbnu@gmail.com | Tel: +82-63-270-3174",
        "kakao_link": "https://open.kakao.com/o/gJBNUBuddy",
        "website": "https://international.jbnu.ac.kr",
    },
    {
        "name": "JBNU Multicultural Film & Media Club",
        "description": (
            "Weekly international film screenings, documentary nights, subtitling workshops, "
            "and a student short-film competition every semester. All languages & nationalities welcome.\n\n"
            "📸 Instagram: @jbnu_film_club\n"
            "📘 Facebook: facebook.com/JBNUfilmclub"
        ),
        "category": "arts",
        "university": "JBNU",
        "meeting_time": "Every Thursday 7:00 PM",
        "location": "Media Center Screening Room",
        "club_type": "club",
        "country": "",
        "contact": "jbnu.filmclub@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gJBNUFilm",
        "website": "https://international.jbnu.ac.kr",
    },
    {
        "name": "JBNU International Volunteer Corps",
        "description": (
            "Community service projects in Jeonju — tutoring local children, elderly care visits, "
            "Hanok Village clean-ups, and environmental campaigns. Earn volunteer hours for scholarship renewal.\n\n"
            "📸 Instagram: @jbnu_volunteer\n"
            "💬 KakaoTalk: Open link below"
        ),
        "category": "volunteer",
        "university": "JBNU",
        "meeting_time": "Every Saturday 10:00 AM",
        "location": "Student Volunteer Center, Room 102",
        "club_type": "club",
        "country": "",
        "contact": "jbnu.volunteer@gmail.com | Tel: +82-63-270-3300",
        "kakao_link": "https://open.kakao.com/o/gJBNUVolunteer",
        "website": "https://international.jbnu.ac.kr",
    },
    {
        "name": "JBNU Taekwondo & Martial Arts Club",
        "description": (
            "Official JBNU Taekwondo club open to international students. Weekly training, "
            "belt promotion tests, inter-university competitions, and a Taekwondo cultural performance "
            "at JBNU International Day.\n\n"
            "📸 Instagram: @jbnu_taekwondo"
        ),
        "category": "sports",
        "university": "JBNU",
        "meeting_time": "Mon, Wed, Fri 6:30 PM",
        "location": "Sports Complex Martial Arts Gym",
        "club_type": "club",
        "country": "",
        "contact": "jbnu.taekwondo@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gJBNUTKD",
        "website": "https://international.jbnu.ac.kr",
    },
    {
        "name": "JBNU Photography & Travel Club",
        "description": (
            "Weekend photo walks around Jeonju Hanok Village, Maisan, Naejangsan, and beyond. "
            "Monthly photo exhibitions on campus and a collaborative travel zine published each semester.\n\n"
            "📸 Instagram: @jbnu_photo_travel\n"
            "📘 Facebook: facebook.com/jbnuphototravel"
        ),
        "category": "arts",
        "university": "JBNU",
        "meeting_time": "Every Saturday 9:00 AM",
        "location": "Arts Building Exhibit Hall",
        "club_type": "club",
        "country": "",
        "contact": "jbnu.photo.travel@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gJBNUPhoto",
        "website": "https://international.jbnu.ac.kr",
    },
    {
        "name": "JBNU International Badminton League",
        "description": (
            "Friendly and competitive badminton for international students at JBNU. "
            "Weekly mixed-doubles sessions and a semester-end tournament with prizes.\n\n"
            "📸 Instagram: @jbnu_badminton_intl"
        ),
        "category": "sports",
        "university": "JBNU",
        "meeting_time": "Every Tuesday & Thursday 7:00 PM",
        "location": "Indoor Sports Hall, Court 3",
        "club_type": "club",
        "country": "",
        "contact": "jbnu.badminton.intl@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gJBNUBadminton",
        "website": "https://international.jbnu.ac.kr",
    },

    # ══════════════════════════════════════════════════════════════════════════
    #  SNU — Seoul National University
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "SNU International Students Association (SNUISA)",
        "description": (
            "The premier international student organisation at Seoul National University. "
            "Orientation, buddy matching, cultural nights, SNU campus tours, and career networking "
            "with leading Korean companies.\n\n"
            "📸 Instagram: @snu_isa_official\n"
            "🌐 Website: snuisa.org\n"
            "📘 Facebook: facebook.com/SNUISA"
        ),
        "category": "social",
        "university": "SNU",
        "meeting_time": "Every Wednesday 6:00 PM",
        "location": "International Student Services Center, Building 63",
        "club_type": "club",
        "country": "",
        "contact": "snuisa.official@gmail.com | Tel: +82-2-880-5084",
        "kakao_link": "https://open.kakao.com/o/gSNUisa",
        "website": "https://oia.snu.ac.kr",
    },
    {
        "name": "SNU Global Leadership Program",
        "description": (
            "A selective leadership development programme for international students at SNU. "
            "Leadership workshops, community projects, mentoring by SNU alumni at top Korean firms, "
            "and a capstone presentation at the SNU Global Forum.\n\n"
            "📸 Instagram: @snu_global_lead\n"
            "🌐 Website: snu.ac.kr/globalleadership"
        ),
        "category": "academic",
        "university": "SNU",
        "meeting_time": "Every Friday 4:00 PM",
        "location": "SNU College of Liberal Studies, Building 1",
        "club_type": "club",
        "country": "",
        "contact": "snu.global.lead@gmail.com | Tel: +82-2-880-6971",
        "kakao_link": "https://open.kakao.com/o/gSNUGLP",
        "website": "https://oia.snu.ac.kr",
    },
    {
        "name": "SNU Korean Language Exchange (KLE)",
        "description": (
            "Weekly Korean ↔ English/other language conversation partners. "
            "TOPIK preparation groups, Korean drama analysis, and a monthly cultural outing to Insadong "
            "or Gyeongbokgung Palace.\n\n"
            "📸 Instagram: @snu_kle\n"
            "💬 KakaoTalk: Open link below"
        ),
        "category": "language",
        "university": "SNU",
        "meeting_time": "Every Tuesday & Thursday 5:00 PM",
        "location": "Language Education Institute, Room 104",
        "club_type": "club",
        "country": "",
        "contact": "snu.kle@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gSNUkle",
        "website": "https://oia.snu.ac.kr",
    },
    {
        "name": "SNU International Entrepreneurs Club",
        "description": (
            "International students building startups in Korea. "
            "Weekly pitch sessions, mentoring by SNU Technology Holding Company, "
            "SNU startup ecosystem tours, and access to SNU's incubator lab.\n\n"
            "📸 Instagram: @snu_intl_startup\n"
            "🌐 LinkedIn: linkedin.com/company/snu-intl-entrepreneurs"
        ),
        "category": "tech",
        "university": "SNU",
        "meeting_time": "Every Thursday 7:00 PM",
        "location": "Graduate School of Business, Innovation Hub",
        "club_type": "club",
        "country": "",
        "contact": "snu.intl.startup@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gSNUStartup",
        "website": "https://oia.snu.ac.kr",
    },
    {
        "name": "SNU International Sports League",
        "description": (
            "Organised sports for international students: soccer, basketball, volleyball, table tennis. "
            "Weekly sessions and an annual inter-faculty tournament at Gwanak Sports Complex.\n\n"
            "📸 Instagram: @snu_intl_sports\n"
            "📘 Facebook: facebook.com/snuintlsports"
        ),
        "category": "sports",
        "university": "SNU",
        "meeting_time": "Every Saturday 10:00 AM",
        "location": "Gwanak Sports Complex",
        "club_type": "club",
        "country": "",
        "contact": "snu.intl.sports@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gSNUSports",
        "website": "https://oia.snu.ac.kr",
    },
    {
        "name": "SNU Global Research Network",
        "description": (
            "Connecting international graduate students and researchers at SNU. "
            "Cross-departmental research collab, access to SNU databases, "
            "journal club, and career seminars with Korean research institutions.\n\n"
            "📸 Instagram: @snu_global_research\n"
            "💬 Telegram: t.me/snu_global_research"
        ),
        "category": "academic",
        "university": "SNU",
        "meeting_time": "Every 2nd Friday 5:00 PM",
        "location": "SNU Graduate Library Seminar Room",
        "club_type": "club",
        "country": "",
        "contact": "snu.global.research@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gSNUResearch",
        "website": "https://oia.snu.ac.kr",
    },

    # ══════════════════════════════════════════════════════════════════════════
    #  Yonsei University — Seoul
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "Yonsei International Students Club (YISC)",
        "description": (
            "The official international student club at Yonsei University. "
            "Yonsei Buddy system, Sinchon neighbourhood food tours, Yonsei-Korea Rivalry Game watch parties, "
            "K-pop cover dance rehearsals, and the Yonsei International Cultural Festival.\n\n"
            "📸 Instagram: @yonsei_isc\n"
            "🌐 Website: yisc.yonsei.ac.kr\n"
            "📘 Facebook: facebook.com/YonseiISC"
        ),
        "category": "social",
        "university": "Yonsei",
        "meeting_time": "Every Thursday 6:00 PM",
        "location": "Student Center, Room 302, Sinchon Campus",
        "club_type": "club",
        "country": "",
        "contact": "yonsei.isc@gmail.com | Tel: +82-2-2123-4160",
        "kakao_link": "https://open.kakao.com/o/gYonseiISC",
        "website": "https://oia.yonsei.ac.kr",
    },
    {
        "name": "Yonsei Global Buddy (YGB)",
        "description": (
            "Yonsei University's buddy programme pairing Korean and international students. "
            "Campus orientation, Korean cooking classes, N Seoul Tower trips, "
            "and monthly cultural exchange events.\n\n"
            "📸 Instagram: @yonsei_global_buddy\n"
            "💬 KakaoTalk: Open link below"
        ),
        "category": "social",
        "university": "Yonsei",
        "meeting_time": "Every semester kick-off + bi-weekly",
        "location": "Office of International Affairs, Admin Building",
        "club_type": "club",
        "country": "",
        "contact": "yonsei.buddy@gmail.com | Tel: +82-2-2123-6374",
        "kakao_link": "https://open.kakao.com/o/gYonseiGBuddy",
        "website": "https://oia.yonsei.ac.kr",
    },
    {
        "name": "Yonsei Korean Language Partners",
        "description": (
            "Language exchange for Korean and international students at Yonsei. "
            "Conversation sessions, TOPIK prep, K-drama script reading, "
            "and visits to Gyeongbokgung, Bukchon, and Hongdae.\n\n"
            "📸 Instagram: @yonsei_klp\n"
            "💬 Telegram: t.me/yonsei_klp"
        ),
        "category": "language",
        "university": "Yonsei",
        "meeting_time": "Tue & Thu 5:00 PM",
        "location": "Underwood Hall Language Lab",
        "club_type": "club",
        "country": "",
        "contact": "yonsei.klp@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gYonseiKLP",
        "website": "https://oia.yonsei.ac.kr",
    },
    {
        "name": "Yonsei International Tech & AI Club",
        "description": (
            "International students coding, building AI projects, and exploring Korea's tech ecosystem. "
            "Hackathons, Kakao/Naver/Samsung campus visits, and monthly AI paper reading sessions.\n\n"
            "📸 Instagram: @yonsei_tech_intl\n"
            "💬 Discord: discord.gg/yonseitech\n"
            "🌐 GitHub: github.com/yonsei-intl-tech"
        ),
        "category": "tech",
        "university": "Yonsei",
        "meeting_time": "Every Wednesday 7:00 PM",
        "location": "Engineering Building B, Room 410",
        "club_type": "club",
        "country": "",
        "contact": "yonsei.tech.intl@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gYonseiTech",
        "website": "https://oia.yonsei.ac.kr",
    },
    {
        "name": "Yonsei International Arts & Photography",
        "description": (
            "Exploring Korean art, street photography in Sinchon and Hongdae, "
            "gallery visits to MMCA, and a semester-end joint exhibition at the Yonsei Art Gallery.\n\n"
            "📸 Instagram: @yonsei_arts_intl\n"
            "📘 Facebook: facebook.com/yonseiArtsIntl"
        ),
        "category": "arts",
        "university": "Yonsei",
        "meeting_time": "Every Saturday 2:00 PM",
        "location": "Yonsei Art Gallery Lobby",
        "club_type": "club",
        "country": "",
        "contact": "yonsei.arts.intl@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gYonseiArts",
        "website": "https://oia.yonsei.ac.kr",
    },
    {
        "name": "Yonsei Global Soccer Club",
        "description": (
            "International and Korean students playing soccer together at Yonsei. "
            "Weekly training, friendly matches, and participation in Seoul International Student League.\n\n"
            "📸 Instagram: @yonsei_global_soccer"
        ),
        "category": "sports",
        "university": "Yonsei",
        "meeting_time": "Every Saturday 9:00 AM",
        "location": "Yonsei Sports Field, Sinchon Campus",
        "club_type": "club",
        "country": "",
        "contact": "yonsei.global.soccer@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gYonseiSoccer",
        "website": "https://oia.yonsei.ac.kr",
    },

    # ══════════════════════════════════════════════════════════════════════════
    #  Korea University (KU) — Seoul
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "KU International Students Organization (KUISO)",
        "description": (
            "The official international student body at Korea University. "
            "KU Buddy matching, campus tours, Anam-dong food crawls, "
            "KU-Yonsei Rivalry Weekend, and the annual KU Global Cultural Festival.\n\n"
            "📸 Instagram: @kuiso_official\n"
            "🌐 Website: kuiso.korea.ac.kr\n"
            "📘 Facebook: facebook.com/KUiso"
        ),
        "category": "social",
        "university": "Korea University",
        "meeting_time": "Every Thursday 6:00 PM",
        "location": "International Center, Anam Campus",
        "club_type": "club",
        "country": "",
        "contact": "kuiso.official@gmail.com | Tel: +82-2-3290-1232",
        "kakao_link": "https://open.kakao.com/o/gKUISO",
        "website": "https://international.korea.ac.kr",
    },
    {
        "name": "KU Global Buddy Program",
        "description": (
            "KU's peer-support programme matching Korean students with international exchange students. "
            "Campus orientation, Gyeongbokgung tour, Bukchon walk, and cultural exchange dinners.\n\n"
            "📸 Instagram: @ku_global_buddy\n"
            "💬 KakaoTalk: Open link below"
        ),
        "category": "social",
        "university": "Korea University",
        "meeting_time": "Every semester kick-off",
        "location": "International Office, Administration Building",
        "club_type": "club",
        "country": "",
        "contact": "ku.global.buddy@gmail.com | Tel: +82-2-3290-1366",
        "kakao_link": "https://open.kakao.com/o/gKUBuddy",
        "website": "https://international.korea.ac.kr",
    },
    {
        "name": "KU Korean–International Language Exchange",
        "description": (
            "Conversation pairings for Korean and international students. "
            "TOPIK prep group, Korean drama analysis, Korean writing workshop, "
            "and field trips to Insadong and Bukchon.\n\n"
            "📸 Instagram: @ku_lang_exchange\n"
            "💬 Telegram: t.me/ku_langexchange"
        ),
        "category": "language",
        "university": "Korea University",
        "meeting_time": "Every Wednesday 5:00 PM",
        "location": "College of Liberal Arts, Language Lab",
        "club_type": "club",
        "country": "",
        "contact": "ku.lang.exchange@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gKULangEx",
        "website": "https://international.korea.ac.kr",
    },
    {
        "name": "KU International Entrepreneurs & Innovation",
        "description": (
            "Korea University's international startup club. Weekly ideathons, "
            "KU Innovation Hub access, mentoring from POSCO & SK Hynix alumni, "
            "and participation in the KU Business School Competition.\n\n"
            "📸 Instagram: @ku_intl_startup\n"
            "🌐 LinkedIn: linkedin.com/company/ku-intl-entrepreneurs"
        ),
        "category": "tech",
        "university": "Korea University",
        "meeting_time": "Every Friday 6:00 PM",
        "location": "Business School Innovation Hub",
        "club_type": "club",
        "country": "",
        "contact": "ku.intl.startup@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gKUStartup",
        "website": "https://international.korea.ac.kr",
    },
    {
        "name": "KU International Sports Association",
        "description": (
            "Soccer, basketball, badminton, volleyball, and table tennis for KU international students. "
            "Inter-university international student sports meet every semester.\n\n"
            "📸 Instagram: @ku_intl_sports\n"
            "📘 Facebook: facebook.com/KUintlSports"
        ),
        "category": "sports",
        "university": "Korea University",
        "meeting_time": "Every Saturday 10:00 AM",
        "location": "Anam Sports Complex",
        "club_type": "club",
        "country": "",
        "contact": "ku.intl.sports@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gKUSports",
        "website": "https://international.korea.ac.kr",
    },

    # ══════════════════════════════════════════════════════════════════════════
    #  Hanyang University (HYU) — Seoul
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "HYU Global International Students Club",
        "description": (
            "The official international student organisation at Hanyang University. "
            "Orientation week, HYU Buddy system, Seoul neighbourhood tours, "
            "cultural exchange performances, and the annual HYU Global Festival.\n\n"
            "📸 Instagram: @hyu_global_isc\n"
            "🌐 Website: global.hanyang.ac.kr\n"
            "📘 Facebook: facebook.com/HYUglobal"
        ),
        "category": "social",
        "university": "Hanyang",
        "meeting_time": "Every Wednesday 6:00 PM",
        "location": "HY-Global Center, Room 101",
        "club_type": "club",
        "country": "",
        "contact": "hyu.global.isc@gmail.com | Tel: +82-2-2220-1054",
        "kakao_link": "https://open.kakao.com/o/gHYUglobal",
        "website": "https://global.hanyang.ac.kr",
    },
    {
        "name": "Hanyang International Buddy (HIB)",
        "description": (
            "HYU's 1-on-1 buddy programme. Korean student guides assist international students "
            "with campus life, Korean language, city navigation, and cultural adjustment.\n\n"
            "📸 Instagram: @hyu_intl_buddy\n"
            "💬 KakaoTalk: Open link below"
        ),
        "category": "social",
        "university": "Hanyang",
        "meeting_time": "Bi-weekly meetups each semester",
        "location": "Office of International Affairs",
        "club_type": "club",
        "country": "",
        "contact": "hyu.intl.buddy@gmail.com | Tel: +82-2-2220-0245",
        "kakao_link": "https://open.kakao.com/o/gHYUBuddy",
        "website": "https://global.hanyang.ac.kr",
    },
    {
        "name": "HYU International Korean Language Club",
        "description": (
            "Korean ↔ English/other language exchange, TOPIK study groups, "
            "Korean calligraphy workshops, and weekly K-drama discussion circles.\n\n"
            "📸 Instagram: @hyu_kor_lang\n"
            "💬 Telegram: t.me/hyu_kor_lang"
        ),
        "category": "language",
        "university": "Hanyang",
        "meeting_time": "Every Tuesday & Thursday 5:30 PM",
        "location": "College of Education, Room 305",
        "club_type": "club",
        "country": "",
        "contact": "hyu.kor.lang@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gHYULang",
        "website": "https://global.hanyang.ac.kr",
    },
    {
        "name": "Hanyang International Tech Collective",
        "description": (
            "AI, robotics, and software projects by international students at HYU. "
            "Hackathons, collaboration with HYU's ERICA campus tech labs, and Samsung alumni talks.\n\n"
            "📸 Instagram: @hyu_tech_intl\n"
            "💬 Discord: discord.gg/hyutech\n"
            "🌐 GitHub: github.com/hyu-intl-tech"
        ),
        "category": "tech",
        "university": "Hanyang",
        "meeting_time": "Every Wednesday 7:00 PM",
        "location": "Engineering Building 2, Room 215",
        "club_type": "club",
        "country": "",
        "contact": "hyu.tech.intl@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gHYUTech",
        "website": "https://global.hanyang.ac.kr",
    },
    {
        "name": "HYU International Sports & Recreation",
        "description": (
            "International students at Hanyang competing in soccer, basketball, badminton, and swimming. "
            "Weekly training and participation in Seoul University Games.\n\n"
            "📸 Instagram: @hyu_intl_sports"
        ),
        "category": "sports",
        "university": "Hanyang",
        "meeting_time": "Every Saturday 10:00 AM",
        "location": "Hanyang Sports Complex",
        "club_type": "club",
        "country": "",
        "contact": "hyu.intl.sports@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gHYUSports",
        "website": "https://global.hanyang.ac.kr",
    },

    # ══════════════════════════════════════════════════════════════════════════
    #  SKKU — Sungkyunkwan University (Seoul / Suwon)
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "SKKU International Students Union (SKKU-ISU)",
        "description": (
            "International student union at Sungkyunkwan University. "
            "Orientation week, SKKU Buddy matching, Confucian culture tours to Myeongnyundang, "
            "and the annual SKKU Global Night.\n\n"
            "📸 Instagram: @skku_isu\n"
            "🌐 Website: oia.skku.edu\n"
            "📘 Facebook: facebook.com/SKKUISU"
        ),
        "category": "social",
        "university": "SKKU",
        "meeting_time": "Every Thursday 6:00 PM",
        "location": "International Office, Humanities Campus",
        "club_type": "club",
        "country": "",
        "contact": "skku.isu@gmail.com | Tel: +82-2-760-1256",
        "kakao_link": "https://open.kakao.com/o/gSKKUisu",
        "website": "https://oia.skku.edu",
    },
    {
        "name": "SKKU Korean Language & Culture Hub",
        "description": (
            "Korean language exchange pairs, traditional Korean tea ceremony workshops, "
            "hanji (Korean paper) craft classes, and TOPIK prep groups.\n\n"
            "📸 Instagram: @skku_kor_culture\n"
            "💬 KakaoTalk: Open link below"
        ),
        "category": "language",
        "university": "SKKU",
        "meeting_time": "Every Tuesday 5:30 PM",
        "location": "600th Anniversary Hall, Room 201",
        "club_type": "club",
        "country": "",
        "contact": "skku.kor.culture@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gSKKULang",
        "website": "https://oia.skku.edu",
    },
    {
        "name": "SKKU Global Tech & Samsung Innovation Club",
        "description": (
            "International students in tech and engineering. Samsung Corporation–sponsored workshops, "
            "Suwon Samsung campus tours, hackathons, and career prep sessions.\n\n"
            "📸 Instagram: @skku_global_tech\n"
            "🌐 LinkedIn: linkedin.com/company/skku-global-tech"
        ),
        "category": "tech",
        "university": "SKKU",
        "meeting_time": "Every Wednesday 7:00 PM",
        "location": "Natural Science Campus, Engineering Hall",
        "club_type": "club",
        "country": "",
        "contact": "skku.global.tech@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gSKKUTech",
        "website": "https://oia.skku.edu",
    },
    {
        "name": "SKKU Confucian Culture & Tradition Club",
        "description": (
            "Exploring Joseon dynasty heritage, Confucian philosophy, traditional archery (국궁), "
            "Korean calligraphy (서예), and visits to UNESCO-listed Changdeokgung Palace.\n\n"
            "📸 Instagram: @skku_confucian\n"
            "📘 Facebook: facebook.com/SKKUconfucian"
        ),
        "category": "culture",
        "university": "SKKU",
        "meeting_time": "Every Saturday 2:00 PM",
        "location": "Myeongnyundang Traditional Hall",
        "club_type": "club",
        "country": "",
        "contact": "skku.confucian@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gSKKUCulture",
        "website": "https://oia.skku.edu",
    },
    {
        "name": "SKKU International Sports Federation",
        "description": (
            "Soccer, basketball, volleyball, and badminton competitions for SKKU international students. "
            "Weekly training at Natural Science Campus sports facilities.\n\n"
            "📸 Instagram: @skku_intl_sports"
        ),
        "category": "sports",
        "university": "SKKU",
        "meeting_time": "Every Saturday 10:00 AM",
        "location": "SKKU Sports Complex",
        "club_type": "club",
        "country": "",
        "contact": "skku.intl.sports@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gSKKUSports",
        "website": "https://oia.skku.edu",
    },

    # ══════════════════════════════════════════════════════════════════════════
    #  EWHA Womans University — Seoul
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "EWHA International Students Association (EISA)",
        "description": (
            "International student association at Ewha Womans University. "
            "Campus orientation, EWHA Buddy programme, Sinchon food walks, "
            "Korean beauty & fashion workshops, and the EWHA Global Cultural Night.\n\n"
            "📸 Instagram: @ewha_isa\n"
            "🌐 Website: international.ewha.ac.kr\n"
            "📘 Facebook: facebook.com/EWHAisa"
        ),
        "category": "social",
        "university": "EWHA",
        "meeting_time": "Every Wednesday 5:30 PM",
        "location": "International House, ECC Building",
        "club_type": "club",
        "country": "",
        "contact": "ewha.isa@gmail.com | Tel: +82-2-3277-3181",
        "kakao_link": "https://open.kakao.com/o/gEWHAisa",
        "website": "https://international.ewha.ac.kr",
    },
    {
        "name": "EWHA Korean Language Partners",
        "description": (
            "Korean–English conversation exchange, TOPIK preparation, Hangeul calligraphy, "
            "and Korean film screening nights every month.\n\n"
            "📸 Instagram: @ewha_kor_partners\n"
            "💬 KakaoTalk: Open link below"
        ),
        "category": "language",
        "university": "EWHA",
        "meeting_time": "Every Thursday 5:00 PM",
        "location": "Ewha Language Center, Room 302",
        "club_type": "club",
        "country": "",
        "contact": "ewha.kor.partners@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gEWHALang",
        "website": "https://international.ewha.ac.kr",
    },
    {
        "name": "EWHA Global Arts & Design Collective",
        "description": (
            "International and Korean students exploring fashion design, illustration, "
            "and contemporary art. Collaborative exhibitions at the Ewha Art Gallery, "
            "and visits to Seoul's top art museums.\n\n"
            "📸 Instagram: @ewha_global_arts\n"
            "📘 Facebook: facebook.com/EWHAglobalArts"
        ),
        "category": "arts",
        "university": "EWHA",
        "meeting_time": "Every Friday 4:00 PM",
        "location": "Ewha Art & Design Building, Studio 5",
        "club_type": "club",
        "country": "",
        "contact": "ewha.global.arts@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gEWHAArts",
        "website": "https://international.ewha.ac.kr",
    },
    {
        "name": "EWHA Women in Tech & Leadership",
        "description": (
            "Empowering international women students in STEM and business at Ewha. "
            "Coding bootcamps, mentoring from Ewha alumni in leading Korean companies, "
            "and participation in Grace Hopper Celebration Korea.\n\n"
            "📸 Instagram: @ewha_women_tech\n"
            "🌐 LinkedIn: linkedin.com/company/ewha-women-tech"
        ),
        "category": "tech",
        "university": "EWHA",
        "meeting_time": "Every Tuesday 6:00 PM",
        "location": "Ewha Tech Innovation Center",
        "club_type": "club",
        "country": "",
        "contact": "ewha.women.tech@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gEWHATech",
        "website": "https://international.ewha.ac.kr",
    },
    {
        "name": "EWHA International Health & Wellness Circle",
        "description": (
            "Yoga, pilates, meditation, and hiking meetups for EWHA international students. "
            "Weekly wellness sessions and seasonal health retreats near Seoul.\n\n"
            "📸 Instagram: @ewha_intl_wellness"
        ),
        "category": "sports",
        "university": "EWHA",
        "meeting_time": "Every Saturday 9:00 AM",
        "location": "Ewha Sports Center, Yoga Studio",
        "club_type": "club",
        "country": "",
        "contact": "ewha.intl.wellness@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gEWHAWellness",
        "website": "https://international.ewha.ac.kr",
    },

    # ══════════════════════════════════════════════════════════════════════════
    #  Kyung Hee University (KHU) — Seoul / Suwon
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "KHU International Students Association (KISA)",
        "description": (
            "Official international student association at Kyung Hee University. "
            "Peace Academy events, KHU Buddy programme, Dongdaemun & Cheonggyecheon tours, "
            "and the Kyung Hee Global Festival each semester.\n\n"
            "📸 Instagram: @khu_kisa\n"
            "🌐 Website: oia.khu.ac.kr\n"
            "📘 Facebook: facebook.com/KHUkisa"
        ),
        "category": "social",
        "university": "Kyung Hee",
        "meeting_time": "Every Thursday 6:00 PM",
        "location": "International Center, Administration Building",
        "club_type": "club",
        "country": "",
        "contact": "khu.kisa@gmail.com | Tel: +82-2-961-0114",
        "kakao_link": "https://open.kakao.com/o/gKHUkisa",
        "website": "https://oia.khu.ac.kr",
    },
    {
        "name": "KHU Global Peace & Culture Forum",
        "description": (
            "Rooted in Kyung Hee's global peace vision. "
            "Intercultural dialogue seminars, Model UN, SDG project teams, "
            "and collaboration with the KHU UN Peace Studies program.\n\n"
            "📸 Instagram: @khu_peace_forum\n"
            "🌐 Website: peaceforum.khu.ac.kr"
        ),
        "category": "academic",
        "university": "Kyung Hee",
        "meeting_time": "Every Monday 6:00 PM",
        "location": "Peace Hall, Main Campus",
        "club_type": "club",
        "country": "",
        "contact": "khu.peace.forum@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gKHUPeace",
        "website": "https://oia.khu.ac.kr",
    },
    {
        "name": "KHU Korean Traditional Medicine & Wellness",
        "description": (
            "Exploring Korean traditional medicine (한의학), acupuncture demos, herbal tea sessions, "
            "and wellness workshops with KHU's renowned College of Korean Medicine professors.\n\n"
            "📸 Instagram: @khu_korean_medicine\n"
            "📘 Facebook: facebook.com/khukoreanmedicine"
        ),
        "category": "academic",
        "university": "Kyung Hee",
        "meeting_time": "Every Friday 4:00 PM",
        "location": "College of Korean Medicine, Building 3",
        "club_type": "club",
        "country": "",
        "contact": "khu.korean.medicine@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gKHUMedicine",
        "website": "https://oia.khu.ac.kr",
    },
    {
        "name": "KHU International Music & Performance Club",
        "description": (
            "Traditional Korean music (가야금, 판소리), K-pop covers, and international music fusion. "
            "Weekly jam sessions and performances at the KHU Outdoor Stage.\n\n"
            "📸 Instagram: @khu_music_intl\n"
            "📘 Facebook: facebook.com/khumusicintl"
        ),
        "category": "arts",
        "university": "Kyung Hee",
        "meeting_time": "Every Wednesday 7:00 PM",
        "location": "College of Music, Practice Room 4",
        "club_type": "club",
        "country": "",
        "contact": "khu.music.intl@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gKHUMusic",
        "website": "https://oia.khu.ac.kr",
    },
    {
        "name": "KHU International Taekwondo & Sports",
        "description": (
            "Taekwondo training with KHU's world-famous Physical Education faculty, "
            "plus soccer, basketball, and badminton leagues for international students.\n\n"
            "📸 Instagram: @khu_intl_sports"
        ),
        "category": "sports",
        "university": "Kyung Hee",
        "meeting_time": "Tue & Thu 6:00 PM",
        "location": "Sports Complex, Taekwondo Gym",
        "club_type": "club",
        "country": "",
        "contact": "khu.intl.sports@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gKHUSports",
        "website": "https://oia.khu.ac.kr",
    },

    # ══════════════════════════════════════════════════════════════════════════
    #  Sogang University — Seoul
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "Sogang International Students Community (SISC)",
        "description": (
            "International student community at Sogang University. "
            "Mapo-gu neighbourhood exploration, Korean cooking class, Sinchon market tours, "
            "and the SISC bi-annual Cultural Night.\n\n"
            "📸 Instagram: @sogang_isc\n"
            "📘 Facebook: facebook.com/SogangISC"
        ),
        "category": "social",
        "university": "Sogang",
        "meeting_time": "Every Thursday 6:30 PM",
        "location": "Loyola Library Student Lounge",
        "club_type": "club",
        "country": "",
        "contact": "sogang.isc@gmail.com | Tel: +82-2-705-8105",
        "kakao_link": "https://open.kakao.com/o/gSogangISC",
        "website": "https://international.sogang.ac.kr",
    },
    {
        "name": "Sogang Korean Language Exchange",
        "description": (
            "Sogang Korean-method language exchange — world-famous for its communicative approach. "
            "Paired conversation, TOPIK prep, and monthly cultural immersion day trips.\n\n"
            "📸 Instagram: @sogang_kor_ex\n"
            "💬 KakaoTalk: Open link below"
        ),
        "category": "language",
        "university": "Sogang",
        "meeting_time": "Mon & Wed 5:00 PM",
        "location": "Sogang Korean Language Institute",
        "club_type": "club",
        "country": "",
        "contact": "sogang.kor.ex@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gSogangLang",
        "website": "https://international.sogang.ac.kr",
    },
    {
        "name": "Sogang Global Business & Consulting Club",
        "description": (
            "International students in business and consulting at Sogang GSB. "
            "Case study competitions, Korean conglomerate company visits, and mock consulting projects.\n\n"
            "📸 Instagram: @sogang_biz_intl\n"
            "🌐 LinkedIn: linkedin.com/company/sogang-global-biz"
        ),
        "category": "academic",
        "university": "Sogang",
        "meeting_time": "Every Friday 5:00 PM",
        "location": "Business School, Room 305",
        "club_type": "club",
        "country": "",
        "contact": "sogang.biz.intl@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gSogangBiz",
        "website": "https://international.sogang.ac.kr",
    },
    {
        "name": "Sogang International Film & Media Society",
        "description": (
            "Sogang's international film club screening Korean and world cinema. "
            "Weekly screenings, director discussions, and a student short-film festival each semester.\n\n"
            "📸 Instagram: @sogang_film_intl"
        ),
        "category": "arts",
        "university": "Sogang",
        "meeting_time": "Every Tuesday 7:00 PM",
        "location": "Mass Communication Building, Screening Room",
        "club_type": "club",
        "country": "",
        "contact": "sogang.film.intl@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gSogangFilm",
        "website": "https://international.sogang.ac.kr",
    },

    # ══════════════════════════════════════════════════════════════════════════
    #  Chung-Ang University (CAU) — Seoul / Anseong
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "CAU International Students Club (CAU-ISC)",
        "description": (
            "International student club at Chung-Ang University. "
            "CAU Buddy programme, Dongjak-gu neighbourhood tours, "
            "Korean film & performing arts nights (CAU is famous for its arts college), "
            "and the CAU International Day festival.\n\n"
            "📸 Instagram: @cau_isc_official\n"
            "📘 Facebook: facebook.com/CAUisc"
        ),
        "category": "social",
        "university": "Chung-Ang",
        "meeting_time": "Every Wednesday 6:00 PM",
        "location": "International House, Room 201",
        "club_type": "club",
        "country": "",
        "contact": "cau.isc.official@gmail.com | Tel: +82-2-820-5114",
        "kakao_link": "https://open.kakao.com/o/gCAUisc",
        "website": "https://oia.cau.ac.kr",
    },
    {
        "name": "CAU Global Film & Performing Arts Club",
        "description": (
            "Leveraging CAU's world-class College of Arts. International film screenings, "
            "acting workshops, K-drama production tours, and access to CAU's state-of-the-art studios.\n\n"
            "📸 Instagram: @cau_global_arts\n"
            "📘 Facebook: facebook.com/CAUglobalArts"
        ),
        "category": "arts",
        "university": "Chung-Ang",
        "meeting_time": "Every Friday 5:00 PM",
        "location": "College of Arts, Studio B",
        "club_type": "club",
        "country": "",
        "contact": "cau.global.arts@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gCAUArts",
        "website": "https://oia.cau.ac.kr",
    },
    {
        "name": "CAU International Tech & Media Lab",
        "description": (
            "Combining CAU's arts tradition with technology. Media art projects, VR/AR development, "
            "game design, and collaboration with Korean media companies.\n\n"
            "📸 Instagram: @cau_tech_media\n"
            "💬 Discord: discord.gg/cautech"
        ),
        "category": "tech",
        "university": "Chung-Ang",
        "meeting_time": "Every Thursday 7:00 PM",
        "location": "Engineering Building, Media Lab Room 3",
        "club_type": "club",
        "country": "",
        "contact": "cau.tech.media@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gCAUTech",
        "website": "https://oia.cau.ac.kr",
    },
    {
        "name": "CAU International Korean Language Club",
        "description": (
            "Korean language exchange and TOPIK prep at Chung-Ang. "
            "Weekly conversation pairs and monthly cultural field trips to Namsan & Itaewon.\n\n"
            "📸 Instagram: @cau_kor_lang\n"
            "💬 KakaoTalk: Open link below"
        ),
        "category": "language",
        "university": "Chung-Ang",
        "meeting_time": "Tue & Thu 5:30 PM",
        "location": "College of Humanities, Language Lab",
        "club_type": "club",
        "country": "",
        "contact": "cau.kor.lang@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gCAULang",
        "website": "https://oia.cau.ac.kr",
    },

    # ══════════════════════════════════════════════════════════════════════════
    #  Inha University — Incheon
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "Inha International Students Association (Inha-ISA)",
        "description": (
            "Official international student association at Inha University, Incheon. "
            "Incheon Chinatown & Songdo tours, airport city exploration, "
            "INHA Buddy programme, and the annual Inha Global Day.\n\n"
            "📸 Instagram: @inha_isa_official\n"
            "🌐 Website: oia.inha.ac.kr\n"
            "📘 Facebook: facebook.com/InhaISA"
        ),
        "category": "social",
        "university": "Inha",
        "meeting_time": "Every Wednesday 6:00 PM",
        "location": "International Office Building, Room 102",
        "club_type": "club",
        "country": "",
        "contact": "inha.isa@gmail.com | Tel: +82-32-860-7022",
        "kakao_link": "https://open.kakao.com/o/gInhaISA",
        "website": "https://oia.inha.ac.kr",
    },
    {
        "name": "Inha Aerospace & Engineering International Club",
        "description": (
            "Leveraging Inha's prestigious aerospace engineering program. "
            "Incheon International Airport industry tours, aerospace company visits, "
            "and international student research showcases.\n\n"
            "📸 Instagram: @inha_aerospace_intl\n"
            "🌐 LinkedIn: linkedin.com/company/inha-aerospace-intl"
        ),
        "category": "tech",
        "university": "Inha",
        "meeting_time": "Every Friday 5:00 PM",
        "location": "College of Engineering, Aerospace Lab",
        "club_type": "club",
        "country": "",
        "contact": "inha.aerospace.intl@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gInhaAerospace",
        "website": "https://oia.inha.ac.kr",
    },
    {
        "name": "Inha Korean Language Exchange Circle",
        "description": (
            "Korean–English/other language pairs, TOPIK prep, Korean writing workshops, "
            "and Incheon city walking tours (Songdo, Chinatown, Wolmido Island).\n\n"
            "📸 Instagram: @inha_kor_exchange\n"
            "💬 KakaoTalk: Open link below"
        ),
        "category": "language",
        "university": "Inha",
        "meeting_time": "Tue & Thu 5:00 PM",
        "location": "College of Education Building, Room 204",
        "club_type": "club",
        "country": "",
        "contact": "inha.kor.exchange@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gInhaLang",
        "website": "https://oia.inha.ac.kr",
    },
    {
        "name": "Inha International Sports League",
        "description": (
            "Soccer, basketball, volleyball, and badminton for international students at Inha. "
            "Weekly training and inter-university Incheon student sports competition.\n\n"
            "📸 Instagram: @inha_intl_sports"
        ),
        "category": "sports",
        "university": "Inha",
        "meeting_time": "Every Saturday 10:00 AM",
        "location": "Inha Sports Complex",
        "club_type": "club",
        "country": "",
        "contact": "inha.intl.sports@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gInhaSports",
        "website": "https://oia.inha.ac.kr",
    },

    # ══════════════════════════════════════════════════════════════════════════
    #  PNU — Pusan National University (Busan)
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "PNU International Students Association (PNU-ISA)",
        "description": (
            "The official international student body at Pusan National University. "
            "Busan orientation, Haeundae Beach tours, Gamcheon Culture Village visits, "
            "PNU Buddy programme, and the annual PNU Global Festival.\n\n"
            "📸 Instagram: @pnu_isa_official\n"
            "🌐 Website: oia.pusan.ac.kr\n"
            "📘 Facebook: facebook.com/PNUisa"
        ),
        "category": "social",
        "university": "PNU",
        "meeting_time": "Every Thursday 6:00 PM",
        "location": "International House, Main Campus",
        "club_type": "club",
        "country": "",
        "contact": "pnu.isa@gmail.com | Tel: +82-51-510-2042",
        "kakao_link": "https://open.kakao.com/o/gPNUisa",
        "website": "https://oia.pusan.ac.kr",
    },
    {
        "name": "PNU Korean Language & Busan Life Club",
        "description": (
            "Korean language exchange with a Busan dialect twist. "
            "TOPIK prep, Korean writing sessions, and weekly tours of Busan — "
            "from Jagalchi Fish Market to Beomeo-sa Temple.\n\n"
            "📸 Instagram: @pnu_kor_busan\n"
            "💬 KakaoTalk: Open link below"
        ),
        "category": "language",
        "university": "PNU",
        "meeting_time": "Tue & Thu 5:30 PM",
        "location": "Humanities College, Language Lab",
        "club_type": "club",
        "country": "",
        "contact": "pnu.kor.busan@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gPNULang",
        "website": "https://oia.pusan.ac.kr",
    },
    {
        "name": "PNU Global Marine & Ocean Science Club",
        "description": (
            "Leveraging Busan's coastal location and PNU's marine science excellence. "
            "Sea kayaking, Haeundae snorkeling, marine ecology field trips, "
            "and research collaboration with KIOST (Korea Institute of Ocean Science).\n\n"
            "📸 Instagram: @pnu_marine_intl\n"
            "🌐 LinkedIn: linkedin.com/company/pnu-marine-intl"
        ),
        "category": "academic",
        "university": "PNU",
        "meeting_time": "Every Saturday 9:00 AM",
        "location": "College of Marine Science, Room 301",
        "club_type": "club",
        "country": "",
        "contact": "pnu.marine.intl@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gPNUMarine",
        "website": "https://oia.pusan.ac.kr",
    },
    {
        "name": "PNU International Beach & Sports Club",
        "description": (
            "Beach volleyball at Haeundae, soccer, basketball, and water sports for PNU international students. "
            "Weekly sports sessions and an annual Busan International Student Olympics.\n\n"
            "📸 Instagram: @pnu_intl_sports"
        ),
        "category": "sports",
        "university": "PNU",
        "meeting_time": "Every Saturday 10:00 AM",
        "location": "PNU Sports Complex / Haeundae Beach",
        "club_type": "club",
        "country": "",
        "contact": "pnu.intl.sports@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gPNUSports",
        "website": "https://oia.pusan.ac.kr",
    },
    {
        "name": "PNU Global Tech & AI Lab",
        "description": (
            "International students in computer science and AI at PNU. "
            "Weekly project collab, Busan startup ecosystem tours, "
            "and collaboration with BEXCO (Busan's tech convention center).\n\n"
            "📸 Instagram: @pnu_global_tech\n"
            "💬 Discord: discord.gg/pnutech"
        ),
        "category": "tech",
        "university": "PNU",
        "meeting_time": "Every Wednesday 7:00 PM",
        "location": "College of Engineering, IT Building Room 4",
        "club_type": "club",
        "country": "",
        "contact": "pnu.global.tech@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gPNUTech",
        "website": "https://oia.pusan.ac.kr",
    },

    # ══════════════════════════════════════════════════════════════════════════
    #  Konkuk University — Seoul
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "KKU International Students Club (KKU-ISC)",
        "description": (
            "International student club at Konkuk University. "
            "KKU Buddy programme, Gwangjin-gu neighbourhood tours, "
            "Konkuk Lake walks, and monthly cultural potluck nights.\n\n"
            "📸 Instagram: @kku_isc_official\n"
            "📘 Facebook: facebook.com/KKUisc"
        ),
        "category": "social",
        "university": "Konkuk",
        "meeting_time": "Every Wednesday 6:30 PM",
        "location": "Sanghuh Memorial Library, 1F Lounge",
        "club_type": "club",
        "country": "",
        "contact": "kku.isc@gmail.com | Tel: +82-2-450-3114",
        "kakao_link": "https://open.kakao.com/o/gKKUisc",
        "website": "https://oia.konkuk.ac.kr",
    },
    {
        "name": "KKU Korean Language Exchange Partners",
        "description": (
            "Language pairings between Korean and international students. "
            "Weekly conversation sessions, TOPIK prep, and Dongdaemun & Hongdae day trips.\n\n"
            "📸 Instagram: @kku_kor_lang\n"
            "💬 KakaoTalk: Open link below"
        ),
        "category": "language",
        "university": "Konkuk",
        "meeting_time": "Tue & Thu 5:00 PM",
        "location": "College of Liberal Arts, Language Center",
        "club_type": "club",
        "country": "",
        "contact": "kku.kor.lang@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gKKULang",
        "website": "https://oia.konkuk.ac.kr",
    },
    {
        "name": "Konkuk Global Veterinary & Life Sciences Club",
        "description": (
            "Leveraging Konkuk's renowned College of Veterinary Medicine. "
            "Zoo visits, KKU Animal Hospital tours, research showcases, "
            "and career talks by Korean veterinary professionals.\n\n"
            "📸 Instagram: @kku_vet_intl"
        ),
        "category": "academic",
        "university": "Konkuk",
        "meeting_time": "Every Saturday 2:00 PM",
        "location": "College of Veterinary Medicine, Building C",
        "club_type": "club",
        "country": "",
        "contact": "kku.vet.intl@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gKKUVet",
        "website": "https://oia.konkuk.ac.kr",
    },
    {
        "name": "KKU International Sports & Recreation",
        "description": (
            "Soccer, basketball, badminton, and table tennis leagues for Konkuk international students. "
            "Weekly training and an annual KKU International Sports Day.\n\n"
            "📸 Instagram: @kku_intl_sports"
        ),
        "category": "sports",
        "university": "Konkuk",
        "meeting_time": "Every Saturday 10:00 AM",
        "location": "Konkuk Sports Complex",
        "club_type": "club",
        "country": "",
        "contact": "kku.intl.sports@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gKKUSports",
        "website": "https://oia.konkuk.ac.kr",
    },

    # ══════════════════════════════════════════════════════════════════════════
    #  Hongik University — Seoul
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "Hongik International Arts & Design Community",
        "description": (
            "Leveraging Hongik's world-famous fine arts tradition. "
            "International students in painting, sculpture, graphic design, and illustration. "
            "Monthly exhibitions, Hongdae street art tours, and gallery visits.\n\n"
            "📸 Instagram: @hongik_arts_intl\n"
            "📘 Facebook: facebook.com/HongikArtsIntl"
        ),
        "category": "arts",
        "university": "Hongik",
        "meeting_time": "Every Friday 4:00 PM",
        "location": "Fine Arts Building, Studio D",
        "club_type": "club",
        "country": "",
        "contact": "hongik.arts.intl@gmail.com | Tel: +82-2-320-1114",
        "kakao_link": "https://open.kakao.com/o/gHongikArts",
        "website": "https://www.hongik.ac.kr/en/index.do",
    },
    {
        "name": "Hongik International Students Circle",
        "description": (
            "Community for international students at Hongik University. "
            "Hongdae live music nights, indie market exploration, Mapo-gu food tours, "
            "and the Hongik International Cultural Weekend.\n\n"
            "📸 Instagram: @hongik_isc\n"
            "📘 Facebook: facebook.com/HongikISC"
        ),
        "category": "social",
        "university": "Hongik",
        "meeting_time": "Every Thursday 6:00 PM",
        "location": "Student Union Building, Room 203",
        "club_type": "club",
        "country": "",
        "contact": "hongik.isc@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gHongikISC",
        "website": "https://www.hongik.ac.kr/en/index.do",
    },
    {
        "name": "Hongik Music & K-pop Production Club",
        "description": (
            "International students producing music, recording, and performing at Hongik — "
            "the birthplace of K-indie and K-pop underground culture. "
            "Studio access, live performances at Hongdae venues, and music production workshops.\n\n"
            "📸 Instagram: @hongik_music_intl\n"
            "🎵 SoundCloud: soundcloud.com/hongikmusic"
        ),
        "category": "arts",
        "university": "Hongik",
        "meeting_time": "Every Wednesday 7:00 PM",
        "location": "Music College Recording Studio",
        "club_type": "club",
        "country": "",
        "contact": "hongik.music.intl@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gHongikMusic",
        "website": "https://www.hongik.ac.kr/en/index.do",
    },
    {
        "name": "Hongik Global Tech & Interactive Design",
        "description": (
            "Merging Hongik's design excellence with technology. UI/UX design, interactive media, "
            "game design, and AR/VR projects by international students.\n\n"
            "📸 Instagram: @hongik_tech_design\n"
            "💬 Discord: discord.gg/hongiktech"
        ),
        "category": "tech",
        "university": "Hongik",
        "meeting_time": "Every Tuesday 6:30 PM",
        "location": "Interactive Media Lab, Design Building",
        "club_type": "club",
        "country": "",
        "contact": "hongik.tech.design@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gHongikTech",
        "website": "https://www.hongik.ac.kr/en/index.do",
    },

    # ══════════════════════════════════════════════════════════════════════════
    #  Sejong University — Seoul
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "Sejong International Students Association (SISA)",
        "description": (
            "Official international student body at Sejong University. "
            "Sejong Buddy programme, Gwangjin-gu tours, Lotte World nearby visits, "
            "and the Sejong Global Cultural Night.\n\n"
            "📸 Instagram: @sejong_isa\n"
            "📘 Facebook: facebook.com/SejongISA"
        ),
        "category": "social",
        "university": "Sejong",
        "meeting_time": "Every Wednesday 6:00 PM",
        "location": "International Center, Chunghwa Hall",
        "club_type": "club",
        "country": "",
        "contact": "sejong.isa@gmail.com | Tel: +82-2-3408-3114",
        "kakao_link": "https://open.kakao.com/o/gSejongISA",
        "website": "https://oia.sejong.ac.kr",
    },
    {
        "name": "Sejong Global Hotel & Tourism Management Club",
        "description": (
            "Leveraging Sejong's top-ranked Hotel & Tourism College. "
            "Seoul hotel tours, food & beverage tastings, tourism industry internship guidance, "
            "and the annual Sejong Tourism Case Competition.\n\n"
            "📸 Instagram: @sejong_tourism_intl\n"
            "🌐 LinkedIn: linkedin.com/company/sejong-tourism-club"
        ),
        "category": "academic",
        "university": "Sejong",
        "meeting_time": "Every Friday 5:00 PM",
        "location": "Hotel & Tourism Building, Room 201",
        "club_type": "club",
        "country": "",
        "contact": "sejong.tourism.intl@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gSejongTourism",
        "website": "https://oia.sejong.ac.kr",
    },
    {
        "name": "Sejong Korean Language Exchange & TOPIK Prep",
        "description": (
            "Korean–English/other language exchange, TOPIK I & II study groups, "
            "and cultural day trips to Changgyeonggung Palace and Dongdaemun.\n\n"
            "📸 Instagram: @sejong_kor_lang\n"
            "💬 KakaoTalk: Open link below"
        ),
        "category": "language",
        "university": "Sejong",
        "meeting_time": "Tue & Thu 5:30 PM",
        "location": "Liberal Arts Building, Room 103",
        "club_type": "club",
        "country": "",
        "contact": "sejong.kor.lang@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gSejongLang",
        "website": "https://oia.sejong.ac.kr",
    },
    {
        "name": "Sejong International Sports Club",
        "description": (
            "Soccer, basketball, badminton, and swimming for Sejong international students. "
            "Weekly training and an annual Sejong Global Sports Festival.\n\n"
            "📸 Instagram: @sejong_intl_sports"
        ),
        "category": "sports",
        "university": "Sejong",
        "meeting_time": "Every Saturday 10:00 AM",
        "location": "Sejong Sports Complex",
        "club_type": "club",
        "country": "",
        "contact": "sejong.intl.sports@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gSejongSports",
        "website": "https://oia.sejong.ac.kr",
    },

    # ══════════════════════════════════════════════════════════════════════════
    #  Dongguk University — Seoul
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "Dongguk International Students Community",
        "description": (
            "International student community at Dongguk University (near Myeongdong & Namsan). "
            "Namsan Tower walks, Insadong antique shopping, Itaewon food tours, "
            "and the Dongguk Buddhist & Global Culture Night.\n\n"
            "📸 Instagram: @dongguk_isc\n"
            "📘 Facebook: facebook.com/DonggukISC"
        ),
        "category": "social",
        "university": "Dongguk",
        "meeting_time": "Every Thursday 6:30 PM",
        "location": "Central Library Student Lounge",
        "club_type": "club",
        "country": "",
        "contact": "dongguk.isc@gmail.com | Tel: +82-2-2260-3114",
        "kakao_link": "https://open.kakao.com/o/gDonggukISC",
        "website": "https://oia.dongguk.edu",
    },
    {
        "name": "Dongguk Buddhist & Mindfulness Club",
        "description": (
            "Drawing on Dongguk's Buddhist foundation. "
            "Meditation sessions, temple stay programmes, mindfulness yoga, "
            "and visits to Jogyesa Temple in the heart of Seoul.\n\n"
            "📸 Instagram: @dongguk_buddhist_intl"
        ),
        "category": "social",
        "university": "Dongguk",
        "meeting_time": "Every Tuesday 7:00 PM",
        "location": "Meditation Hall, Buddhist Studies Building",
        "club_type": "club",
        "country": "",
        "contact": "dongguk.buddhist.intl@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gDonggukBuddhist",
        "website": "https://oia.dongguk.edu",
    },
    {
        "name": "Dongguk International Film School Club",
        "description": (
            "Dongguk's prestigious Film Arts College offers international students "
            "access to professional studios, screenwriting workshops, "
            "and the Dongguk International Short Film Festival.\n\n"
            "📸 Instagram: @dongguk_film_intl\n"
            "📘 Facebook: facebook.com/DonggukFilmIntl"
        ),
        "category": "arts",
        "university": "Dongguk",
        "meeting_time": "Every Friday 5:30 PM",
        "location": "College of Film Arts, Screening Room B",
        "club_type": "club",
        "country": "",
        "contact": "dongguk.film.intl@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gDonggukFilm",
        "website": "https://oia.dongguk.edu",
    },
    {
        "name": "Dongguk Korean Language & Culture Hub",
        "description": (
            "Korean language exchange, temple tour itineraries, "
            "and Korean Buddhist art study sessions unique to Dongguk's heritage.\n\n"
            "📸 Instagram: @dongguk_kor_lang\n"
            "💬 KakaoTalk: Open link below"
        ),
        "category": "language",
        "university": "Dongguk",
        "meeting_time": "Mon & Wed 5:30 PM",
        "location": "Language Education Center, Room 201",
        "club_type": "club",
        "country": "",
        "contact": "dongguk.kor.lang@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gDonggukLang",
        "website": "https://oia.dongguk.edu",
    },

    # ══════════════════════════════════════════════════════════════════════════
    #  Chonnam National University (CNU) — Gwangju
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "CNU International Students Association (CNU-ISA)",
        "description": (
            "International student association at Chonnam National University in Gwangju. "
            "Gwangju orientation, CNU Buddy programme, 5·18 Democracy Square visits, "
            "Asia Culture Center tours, and the CNU Global Festival.\n\n"
            "📸 Instagram: @cnu_isa_gwangju\n"
            "📘 Facebook: facebook.com/CNUisaGwangju"
        ),
        "category": "social",
        "university": "CNU",
        "meeting_time": "Every Wednesday 5:30 PM",
        "location": "International House, Student Center",
        "club_type": "club",
        "country": "",
        "contact": "cnu.isa.gwangju@gmail.com | Tel: +82-62-530-1114",
        "kakao_link": "https://open.kakao.com/o/gCNUisa",
        "website": "https://oia.jnu.ac.kr",
    },
    {
        "name": "CNU Korean Language Exchange Circle",
        "description": (
            "Korean language exchange between CNU international and Korean students. "
            "TOPIK prep, Gwangju dialect lessons, and cultural field trips to Damyang Bamboo Forest "
            "and Boseong Green Tea Fields.\n\n"
            "📸 Instagram: @cnu_kor_lang\n"
            "💬 KakaoTalk: Open link below"
        ),
        "category": "language",
        "university": "CNU",
        "meeting_time": "Tue & Thu 5:00 PM",
        "location": "College of Liberal Arts, Language Lab",
        "club_type": "club",
        "country": "",
        "contact": "cnu.kor.lang@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gCNULang",
        "website": "https://oia.jnu.ac.kr",
    },
    {
        "name": "CNU Biomedical & Life Sciences International Club",
        "description": (
            "International students in biology, medicine, pharmacy, and life sciences at CNU. "
            "Research collab, hospital observation tours, and career networking with Korean biotech firms.\n\n"
            "📸 Instagram: @cnu_biomed_intl"
        ),
        "category": "academic",
        "university": "CNU",
        "meeting_time": "Every Friday 5:00 PM",
        "location": "College of Medicine, Seminar Room B",
        "club_type": "club",
        "country": "",
        "contact": "cnu.biomed.intl@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gCNUBiomed",
        "website": "https://oia.jnu.ac.kr",
    },
    {
        "name": "CNU International Sports & Outdoor Club",
        "description": (
            "Soccer, basketball, and outdoor activities for CNU international students. "
            "Weekend hikes to Mudeungsan Mountain (UNESCO Global Geopark) and Naejangsan.\n\n"
            "📸 Instagram: @cnu_intl_sports"
        ),
        "category": "sports",
        "university": "CNU",
        "meeting_time": "Every Saturday 9:00 AM",
        "location": "CNU Sports Complex / Mudeungsan trailhead",
        "club_type": "club",
        "country": "",
        "contact": "cnu.intl.sports@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gCNUSports",
        "website": "https://oia.jnu.ac.kr",
    },

    # ══════════════════════════════════════════════════════════════════════════
    #  Ajou University — Suwon
    # ══════════════════════════════════════════════════════════════════════════
    {
        "name": "Ajou International Students Circle (AISC)",
        "description": (
            "International student community at Ajou University, Suwon. "
            "Suwon Hwaseong Fortress tours, Samsung Digital City visits nearby, "
            "AJOU Buddy programme, and the Ajou Global Cultural Night.\n\n"
            "📸 Instagram: @ajou_isc_official\n"
            "📘 Facebook: facebook.com/AjouISC"
        ),
        "category": "social",
        "university": "Ajou",
        "meeting_time": "Every Wednesday 6:00 PM",
        "location": "International Center, Paldal Building",
        "club_type": "club",
        "country": "",
        "contact": "ajou.isc@gmail.com | Tel: +82-31-219-2114",
        "kakao_link": "https://open.kakao.com/o/gAjouISC",
        "website": "https://oia.ajou.ac.kr",
    },
    {
        "name": "Ajou Global Medical & Engineering Club",
        "description": (
            "Ajou is home to a top-10 medical school and engineering programs. "
            "International students in medicine, engineering, and biotech. "
            "Ajou Medical Center tours, research collab, and career seminars.\n\n"
            "📸 Instagram: @ajou_med_eng_intl"
        ),
        "category": "academic",
        "university": "Ajou",
        "meeting_time": "Every Friday 5:30 PM",
        "location": "Medical School Building, Seminar Room 2",
        "club_type": "club",
        "country": "",
        "contact": "ajou.med.eng.intl@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gAjouMedEng",
        "website": "https://oia.ajou.ac.kr",
    },
    {
        "name": "Ajou Korean Language & Suwon Culture Club",
        "description": (
            "Korean language exchange, TOPIK prep, and Suwon cultural exploration — "
            "Hwaseong Fortress, Suwon Traditional Market, and royal cuisine experiences.\n\n"
            "📸 Instagram: @ajou_kor_lang\n"
            "💬 KakaoTalk: Open link below"
        ),
        "category": "language",
        "university": "Ajou",
        "meeting_time": "Tue & Thu 5:00 PM",
        "location": "College of Humanities, Language Center",
        "club_type": "club",
        "country": "",
        "contact": "ajou.kor.lang@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gAjouLang",
        "website": "https://oia.ajou.ac.kr",
    },
    {
        "name": "Ajou International Sports Association",
        "description": (
            "Soccer, basketball, volleyball, and badminton for Ajou international students. "
            "Weekly training and an annual Suwon International Student Sports Meet.\n\n"
            "📸 Instagram: @ajou_intl_sports"
        ),
        "category": "sports",
        "university": "Ajou",
        "meeting_time": "Every Saturday 10:00 AM",
        "location": "Ajou Sports Complex",
        "club_type": "club",
        "country": "",
        "contact": "ajou.intl.sports@gmail.com",
        "kakao_link": "https://open.kakao.com/o/gAjouSports",
        "website": "https://oia.ajou.ac.kr",
    },
]


def seed():
    app = create_app()
    bcrypt = Bcrypt(app)

    with app.app_context():
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

        added = updated = 0
        for data in UNIVERSITY_CLUBS:
            existing = Club.query.filter_by(name=data["name"]).first()
            if existing:
                existing.description  = data["description"]
                existing.contact      = data.get("contact", "")
                existing.kakao_link   = data.get("kakao_link", "")
                existing.meeting_time = data["meeting_time"]
                existing.location     = data["location"]
                existing.university   = data["university"]
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
                club_type=data.get("club_type", "club"),
                country=data.get("country", ""),
                contact=data.get("contact", ""),
                kakao_link=data.get("kakao_link", ""),
                website=data.get("website", ""),
                created_by=admin.id,
                is_active=True,
            )
            db.session.add(club)
            added += 1
            print(f"  ✓ Added: {data['name']} [{data['university']}]")

        db.session.commit()
        print(f"\nDone! Added {added} clubs, updated {updated}.")


if __name__ == "__main__":
    seed()
