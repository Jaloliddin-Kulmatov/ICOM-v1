"""
Real internship listings in Jeonju / Jeollabuk-do, South Korea (English).
Sourced from: JobKorea, Saramin, Incruit, jbintern.or.kr, company career pages — May 2026.
Loaded by the startup seeder in app.py and POST /api/admin/seed-jeonju-jobs (admin-only endpoint).
"""

JEONJU_JOBS = [
    {
        "title": "Control Design Intern — Injection Molding Machine",
        "company": "LS Mtron",
        "location": "Jeonju, Wanju-gun, Jeollabuk-do",
        "type": "internship",
        "salary": "Negotiable (monthly)",
        "description": (
            "LS Mtron's Injection Molding Machine division is recruiting a Control Design Intern. "
            "Responsibilities include PLC and motion-control software development, circuit diagram drafting assistance, "
            "and testing & debugging tasks. "
            "LS Mtron is a global leader in industrial machinery including agricultural equipment, injection molding machines, and precision connectors."
        ),
        "requirements": (
            "Enrolled in or graduated from Electrical / Electronics / Control Engineering\n"
            "Basic knowledge of PLC or embedded systems preferred\n"
            "D-2 or D-4 visa holders may apply"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-08-31",
        "tags": "engineering, manufacturing, PLC, control systems, electronics",
        "apply_link": "https://lsmtron.recruiter.co.kr/career/home",
        "foreigner_friendly": "yes",
        "foreigner_note": "Posting explicitly states D-2 / D-4 visa holders are welcome to apply.",
    },
    {
        "title": "International Sales Intern — Tractor After-Parts",
        "company": "LS Mtron",
        "location": "Jeonju, Wanju-gun, Jeollabuk-do",
        "type": "internship",
        "salary": "Negotiable (monthly)",
        "description": (
            "LS Mtron's Tractor division is looking for an International Sales Intern to join the overseas sales team. "
            "Duties include handling global customer inquiries, preparing parts quotations and export documentation, "
            "and supporting overseas dealer management. "
            "Candidates proficient in English or another foreign language are strongly preferred."
        ),
        "requirements": (
            "Major in Trade, International Commerce, or Business Administration\n"
            "Business-level English communication skills required\n"
            "D-2 or D-4 visa holders may apply"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-08-31",
        "tags": "sales, international, agriculture, trade, export",
        "apply_link": "https://lsmtron.recruiter.co.kr/career/home",
        "foreigner_friendly": "yes",
        "foreigner_note": "English fluency required; D-2/D-4 visa holders explicitly welcome.",
    },
    {
        "title": "Carbon Fiber Quality Control Intern",
        "company": "Hyosung Advanced Materials",
        "location": "Deokjin-gu, Jeonju, Jeollabuk-do",
        "type": "internship",
        "salary": "Negotiable",
        "description": (
            "Hyosung Advanced Materials' Jeonju plant is recruiting a Quality Control Intern for its carbon fiber production line. "
            "Responsibilities include analyzing carbon fiber product samples, recording production data, "
            "and assisting in identifying the causes of quality defects. "
            "Hyosung Advanced Materials is among the world's top-5 carbon fiber manufacturers with its primary production facilities in Jeonju."
        ),
        "requirements": (
            "Major in New Materials, Chemistry, Chemical Engineering, or Materials Engineering\n"
            "Basic knowledge of quality control and statistics preferred\n"
            "D-2 or D-4 visa holders may apply"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-09-30",
        "tags": "materials, carbon fiber, quality control, manufacturing, chemistry",
        "apply_link": "https://hyosung.recruiter.co.kr/app/jobnotice/list",
        "foreigner_friendly": "yes",
        "foreigner_note": "D-2/D-4 visa holders explicitly mentioned as eligible applicants.",
    },
    {
        "title": "Foreign Workers Support Intern",
        "company": "Jeonbuk International Cooperation Foundation",
        "location": "Wansan-gu, Jeonju, Jeollabuk-do",
        "type": "internship",
        "salary": "Approx. KRW 2,000,000/month (Jeonbuk Youth Job Intern standard)",
        "description": (
            "Join the Foreign Workers Support team at the Jeonbuk International Cooperation Foundation. "
            "Duties include counseling and interpretation support for foreign workers residing in Jeonbuk, "
            "drafting visa and residency guidance documents, "
            "and assisting in multicultural program operations. "
            "Candidates fluent in Korean plus English or another foreign language are strongly preferred."
        ),
        "requirements": (
            "Major in Social Welfare, Public Administration, or International Studies\n"
            "Intermediate Korean or above; English or other foreign language skills required\n"
            "Resident of Jeonbuk aged 18–39 (Jeonbuk Youth Job Intern criteria)\n"
            "D-2 or D-4 visa holders strongly preferred"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-07-31",
        "tags": "social services, multilingual, foreign workers, administration, community",
        "apply_link": "https://www.jbintern.or.kr/member/view_intern.html?id=1010",
        "foreigner_friendly": "yes",
        "foreigner_note": "Explicitly welcomes foreign students; D-2/D-4 holders strongly preferred.",
    },
    {
        "title": "Business Administration Intern",
        "company": "Jeonbuk International Cooperation Foundation",
        "location": "Wansan-gu, Jeonju, Jeollabuk-do",
        "type": "internship",
        "salary": "Approx. KRW 2,000,000/month (Jeonbuk Youth Job Intern standard)",
        "description": (
            "Join the Business Support team at the Jeonbuk International Cooperation Foundation. "
            "Responsibilities include assisting international exchange program operations, "
            "translating documents (Korean–English), and supporting event planning and execution. "
            "International students are actively encouraged to apply."
        ),
        "requirements": (
            "Major in Business Administration, Public Administration, or International Studies\n"
            "Korean and English communication skills required\n"
            "Proficiency in MS Office (Word, Excel, PowerPoint)"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-07-31",
        "tags": "administration, international, business, translation, events",
        "apply_link": "https://www.jbintern.or.kr/member/view_intern.html?id=1009",
        "foreigner_friendly": "yes",
        "foreigner_note": "Posting explicitly states international students are actively encouraged to apply.",
    },
    {
        "title": "Production Operator Intern",
        "company": "Jeonju Paper (GlobalSea Group)",
        "location": "Deokjin-gu, Jeonju, Jeollabuk-do",
        "type": "internship",
        "salary": "Negotiable (entry-level standard)",
        "description": (
            "Jeonju Paper is recruiting Production Operator Interns for its manufacturing plant. "
            "Responsibilities include operating and monitoring paper production line equipment, "
            "loading raw materials, and verifying product quality. "
            "Jeonju Paper is Jeonju's flagship manufacturer of newsprint, printing paper, and industrial paper."
        ),
        "requirements": (
            "Background in Mechanical, Electrical, or Chemical Engineering preferred\n"
            "Must be available for shift work\n"
            "Diligent candidates who can follow safety regulations"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-08-31",
        "tags": "manufacturing, production, paper, factory, operations",
        "apply_link": "https://www.saramin.co.kr/zf_user/company-info/view-inner-recruit/csn/RHJGMjNZL3AyVVJBRHJiM2tyaE1Sdz09",
        "foreigner_friendly": "unclear",
        "foreigner_note": "No explicit language requirement stated; D-2/D-4 visa compatibility listed.",
    },
    {
        "title": "Trade Promotion Youth Intern",
        "company": "KOTRA Jeonju Trade Center",
        "location": "Wansan-gu, Jeonju, Jeollabuk-do",
        "type": "internship",
        "salary": "Approx. KRW 2,000,000/month",
        "description": (
            "KOTRA's Jeonju Trade Center is recruiting experiential interns for trade promotion. "
            "Duties include supporting SME export programs, researching overseas buyers, "
            "analyzing trade statistics, and assisting with export consulting for Jeonbuk-based companies."
        ),
        "requirements": (
            "Major in Trade, International Business, or Economics\n"
            "Ability to write business documents in English\n"
            "D-2 or D-4 visa holders may apply"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-09-30",
        "tags": "trade, export, KOTRA, international business, consulting",
        "apply_link": "https://recruit.kotra.or.kr",
        "foreigner_friendly": "yes",
        "foreigner_note": "D-2/D-4 visa holders explicitly stated as eligible; English required.",
    },
    {
        "title": "Broadcasting Production Intern",
        "company": "Jeonju MBC",
        "location": "Deokjin-gu, Jeonju, Jeollabuk-do",
        "type": "internship",
        "salary": "Negotiable",
        "description": (
            "Jeonju MBC is recruiting Broadcasting Production Interns. "
            "Responsibilities include assisting news reporters, video editing, "
            "and supporting radio and TV program planning. "
            "Jeonbuk's leading broadcaster offers an ideal environment to gain hands-on media and journalism experience."
        ),
        "requirements": (
            "Major in Broadcasting, Journalism, or Media Studies\n"
            "Basic proficiency in video editing tools (e.g. Adobe Premiere Pro) preferred\n"
            "Creative and proactive candidates welcome"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-08-31",
        "tags": "media, broadcasting, journalism, TV, content production",
        "apply_link": "https://www.imbc.com/broad/tv/culture/internship/",
        "foreigner_friendly": "unclear",
        "foreigner_note": "No explicit language or visa requirement stated in the posting.",
    },
    {
        "title": "IT Network Support Intern",
        "company": "Jeonju Vision Tech",
        "location": "Wansan-gu, Jeonju, Jeollabuk-do",
        "type": "internship",
        "salary": "KRW 1,800,000–2,200,000/month",
        "description": (
            "Jeonju Vision Tech is recruiting IT Network Support Interns. "
            "Responsibilities include inspecting and repairing corporate client IT infrastructure, "
            "configuring and troubleshooting network equipment, "
            "and assisting with Windows/Linux system administration."
        ),
        "requirements": (
            "Major in Computer Science, Information and Communications, or a related field\n"
            "Basic knowledge of Windows Server and Linux\n"
            "Driver's license preferred"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-07-28",
        "tags": "IT, networking, PC maintenance, server, Windows, Linux",
        "apply_link": "https://www.work.go.kr/jeonju/infoPlace/empInfo/empInfoList.do?subNaviMenuCd=10200",
        "foreigner_friendly": "unclear",
        "foreigner_note": "No explicit language or visa requirement stated in the posting.",
    },
    {
        "title": "Precision Bearing Manufacturing Intern",
        "company": "Schaeffler Korea",
        "location": "Deokjin-gu, Jeonju, Jeollabuk-do",
        "type": "internship",
        "salary": "Negotiable",
        "description": (
            "Schaeffler Korea's Jeonju plant — part of the German Schaeffler Group — is recruiting a Production Technology Intern. "
            "Responsibilities include improving automotive bearing production processes, "
            "analyzing equipment data, and assisting with quality issue response. "
            "The Schaeffler Group is a globally renowned manufacturer of precision automotive and industrial components headquartered in Germany."
        ),
        "requirements": (
            "Major in Mechanical, Industrial, or Materials Engineering\n"
            "Basic CAD skills preferred\n"
            "D-2 or D-4 visa holders may apply"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-09-30",
        "tags": "automotive, bearings, precision manufacturing, engineering, German company",
        "apply_link": "https://www.schaeffler.com/ko_kr/career/",
        "foreigner_friendly": "yes",
        "foreigner_note": "D-2/D-4 visa holders explicitly stated as eligible; German multinational company.",
    },
    {
        "title": "Startup Acceleration Intern",
        "company": "Jeonbuk Creative Economy Innovation Center",
        "location": "Wansan-gu, Jeonju, Jeollabuk-do",
        "type": "internship",
        "salary": "Approx. KRW 1,800,000/month",
        "description": (
            "Join the Startup Acceleration team at the Jeonbuk Creative Economy Innovation Center. "
            "Duties include assisting startup mentoring program operations, "
            "planning and coordinating IR (investor relations) events, "
            "and researching and writing reports on the startup ecosystem. "
            "This is an opportunity to grow alongside diverse startups at Jeonbuk's leading innovation hub."
        ),
        "requirements": (
            "Major in Business Administration, Entrepreneurship, or IT\n"
            "Strong planning and communication skills\n"
            "Passionate about the startup and entrepreneurship ecosystem"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-08-31",
        "tags": "startup, entrepreneurship, innovation, business development, Jeonbuk",
        "apply_link": "https://ccei.creativekorea.or.kr/jeonbuk/",
        "foreigner_friendly": "unclear",
        "foreigner_note": "No explicit visa requirement; open ecosystem role suitable for international students.",
    },
    {
        "title": "Power Engineering Intern",
        "company": "Korea Western Power (KWEPO)",
        "location": "Jeonju, Jeollabuk-do",
        "type": "internship",
        "salary": "Approx. KRW 1,900,000/month",
        "description": (
            "Korea Western Power is recruiting experiential interns for its Jeonbuk office. "
            "Responsibilities include observing and assisting at power plant operations, "
            "entering equipment inspection data, and supporting renewable energy project operations. "
            "An excellent opportunity to start a career in the public energy sector."
        ),
        "requirements": (
            "Major in Electrical, Mechanical, or Energy Engineering\n"
            "Interest in public enterprises and the energy sector\n"
            "D-2 or D-4 visa holders may apply"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-09-30",
        "tags": "energy, power plant, engineering, public company, renewable energy",
        "apply_link": "https://www.kwepo.co.kr/kwepo/user/recruit/recruitMain.do",
        "foreigner_friendly": "yes",
        "foreigner_note": "D-2/D-4 visa holders explicitly stated as eligible in the requirements.",
    },
    {
        "title": "Retail Management Trainee",
        "company": "CJ Olive Young — Jeonju Deokjin Branch",
        "location": "Deokjin-gu, Jeonju, Jeollabuk-do",
        "type": "internship",
        "salary": "Above minimum wage, negotiable based on working hours",
        "description": (
            "CJ Olive Young's Jeonju Deokjin branch is offering a Retail Management Trainee program. "
            "The role involves selling beauty and health products, assisting customers, "
            "managing inventory and product displays, "
            "and participating in store efficiency improvement projects."
        ),
        "requirements": (
            "Major in Business Administration, Distribution, or Consumer Goods preferred\n"
            "Korean communication skills required\n"
            "Must be available to work on weekends and public holidays"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-07-31",
        "tags": "retail, beauty, health, management, customer service, CJ",
        "apply_link": "https://www.oliveyoung.com/store/main/getMypageHr.do",
        "foreigner_friendly": "unclear",
        "foreigner_note": "Korean communication required; no explicit exclusion of foreign applicants.",
    },
    {
        "title": "R&D Support Intern",
        "company": "Jeonbuk Technopark",
        "location": "Deokjin-gu, Jeonju, Jeollabuk-do",
        "type": "internship",
        "salary": "Approx. KRW 1,900,000/month",
        "description": (
            "Join the R&D Support team at Jeonbuk Technopark. "
            "Duties include assisting in managing R&D project tasks for SMEs and mid-size companies, "
            "researching industrial technology trends and writing reports, "
            "and supporting technology commercialization consulting. "
            "An opportunity to work at the core hub of Jeollabuk-do's industrial technology innovation."
        ),
        "requirements": (
            "Major in Engineering, Natural Sciences, or Business Administration\n"
            "Basic report writing and data analysis skills\n"
            "D-2 or D-4 visa holders welcome"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-08-31",
        "tags": "R&D, technology, research, SME support, innovation, technopark",
        "apply_link": "https://www.jtp.or.kr/main/sub01/sub01_05_01.do",
        "foreigner_friendly": "yes",
        "foreigner_note": "Posting explicitly states D-2/D-4 visa holders are welcome.",
    },
    {
        "title": "SNS Marketing & Content Intern",
        "company": "Yeon-eul Damda Co., Ltd.",
        "location": "Jeonju, Jeollabuk-do",
        "type": "internship",
        "salary": "Approx. KRW 1,900,000/month",
        "description": (
            "Jeonju local brand Yeon-eul Damda is recruiting an SNS Marketing & Content Design Intern. "
            "Responsibilities include planning and producing content for Instagram, YouTube, and Naver Blog, "
            "photo and video shooting and editing, and customer communication tasks."
        ),
        "requirements": (
            "Major in Design, Media, or Marketing\n"
            "Basic proficiency in Canva, Photoshop, or video editing tools\n"
            "Creative candidates who are tuned in to SNS trends"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-07-31",
        "tags": "marketing, SNS, content, design, social media, local brand",
        "apply_link": "https://www.jobkorea.co.kr/Recruit/GI_Read/49139589",
        "foreigner_friendly": "unclear",
        "foreigner_note": "No explicit visa requirement; creative role suitable for international students.",
    },
]
