"""
Real internship listings in Jeonju / Jeollabuk-do, South Korea.
Sourced from: JobKorea, Saramin, Incruit, jbintern.or.kr, company career pages — May 2026.
Loaded by POST /api/admin/seed-jeonju-jobs (admin-only endpoint).
"""

JEONJU_JOBS = [
    {
        "title": "사출성형기 제어설계 인턴 (Control Design Intern)",
        "company": "LS엠트론㈜",
        "location": "전주, 전라북도 완주군",
        "type": "internship",
        "salary": "협의 (월급)",
        "description": (
            "LS엠트론 사출성형기 사업부에서 제어설계 인턴을 모집합니다. "
            "PLC 및 모션 제어 소프트웨어 개발, 회로도 설계 보조, 테스트 및 디버깅 업무를 담당합니다. "
            "LS엠트론은 농기계, 사출성형기, 정밀커넥터 등 산업기계 분야의 글로벌 선도기업입니다."
        ),
        "requirements": (
            "전기/전자/제어공학 전공 재학 또는 졸업\n"
            "PLC 또는 임베디드 시스템 기초 지식 우대\n"
            "D-2 또는 D-4 비자 소지자 지원 가능"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-08-31",
        "tags": "engineering, manufacturing, PLC, control systems, electronics",
        "apply_link": "https://lsmtron.recruiter.co.kr/career/home",
    },
    {
        "title": "트랙터 서비스부품 해외영업 인턴 (International Sales Intern)",
        "company": "LS엠트론㈜",
        "location": "전주, 전라북도 완주군",
        "type": "internship",
        "salary": "협의 (월급)",
        "description": (
            "LS엠트론 트랙터 사업부 해외영업팀 인턴을 모집합니다. "
            "글로벌 고객사 대응, 부품 견적·수출 서류 처리, 해외 딜러 관리 보조 업무를 담당합니다. "
            "영어 또는 제2외국어 능통자 우대."
        ),
        "requirements": (
            "무역·국제통상·경영 계열 전공\n"
            "영어 비즈니스 커뮤니케이션 가능자\n"
            "D-2, D-4 비자 소지자 지원 가능"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-08-31",
        "tags": "sales, international, agriculture, trade, export",
        "apply_link": "https://lsmtron.recruiter.co.kr/career/home",
    },
    {
        "title": "탄소섬유 품질관리 인턴 (Carbon Fiber QC Intern)",
        "company": "효성첨단소재㈜",
        "location": "전주시 덕진구, 전라북도",
        "type": "internship",
        "salary": "협의",
        "description": (
            "효성첨단소재 전주공장 탄소섬유 생산라인 품질관리 인턴입니다. "
            "탄소섬유 제품 샘플 분석, 생산 데이터 기록, 품질 이상 원인 파악 보조 업무를 수행합니다. "
            "효성첨단소재는 세계 5위권 탄소섬유 제조기업으로 전주에 주요 생산시설을 두고 있습니다."
        ),
        "requirements": (
            "신소재·화학·화학공학·재료공학 전공\n"
            "품질관리·통계 기초지식 우대\n"
            "D-2, D-4 비자 가능"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-09-30",
        "tags": "materials, carbon fiber, quality control, manufacturing, chemistry",
        "apply_link": "https://hyosung.recruiter.co.kr/app/jobnotice/list",
    },
    {
        "title": "외국인 근로자 지원 인턴 (Foreign Workers Support Intern)",
        "company": "전북국제협력재단",
        "location": "전주시 완산구, 전라북도",
        "type": "internship",
        "salary": "약 200만 원/월 (전북청년 직무인턴 기준)",
        "description": (
            "전북국제협력재단 외국인 근로자 지원팀 인턴입니다. "
            "전북 거주 외국인 근로자 상담·통역 지원, 비자·체류 안내 문서 작성, "
            "다문화 프로그램 운영 보조 업무를 담당합니다. "
            "한국어와 영어 또는 기타 외국어 능통자 크게 우대합니다."
        ),
        "requirements": (
            "사회복지·행정·국제학 관련 전공\n"
            "한국어 중급 이상, 영어 또는 기타 외국어 가능\n"
            "전북 거주 만 18~39세 청년 (전북청년 직무인턴 기준)\n"
            "D-2, D-4 비자 소지자 우대"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-07-31",
        "tags": "social services, multilingual, foreign workers, administration, community",
        "apply_link": "https://www.jbintern.or.kr/member/view_intern.html?id=1010",
    },
    {
        "title": "비즈니스 지원 행정 인턴 (Business Admin Intern)",
        "company": "전북국제협력재단",
        "location": "전주시 완산구, 전라북도",
        "type": "internship",
        "salary": "약 200만 원/월 (전북청년 직무인턴 기준)",
        "description": (
            "전북국제협력재단 비즈니스 지원팀 인턴입니다. "
            "국제교류 사업 운영 보조, 문서 번역(한·영), 행사 기획·운영 지원 업무를 담당합니다. "
            "외국인 유학생 인턴도 적극 환영합니다."
        ),
        "requirements": (
            "경영·행정·국제학 전공\n"
            "한국어 및 영어 커뮤니케이션 가능\n"
            "MS Office(Word, Excel, PowerPoint) 활용 가능"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-07-31",
        "tags": "administration, international, business, translation, events",
        "apply_link": "https://www.jbintern.or.kr/member/view_intern.html?id=1009",
    },
    {
        "title": "생산 오퍼레이터 인턴 (Production Operator Intern)",
        "company": "㈜전주페이퍼 (GlobalSea Group)",
        "location": "전주시 덕진구, 전라북도",
        "type": "internship",
        "salary": "협의 (신입 기준)",
        "description": (
            "전주페이퍼 생산공장 오퍼레이터 인턴을 모집합니다. "
            "제지 생산라인 설비 운전·모니터링, 원료 투입 및 제품 품질 확인 업무를 담당합니다. "
            "전주페이퍼는 신문용지, 인쇄용지, 산업용지를 생산하는 전주 대표 제조기업입니다."
        ),
        "requirements": (
            "기계·전기·화학공학 관련 전공 우대\n"
            "교대근무 가능자\n"
            "성실하고 안전 규정 준수 가능한 인재"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-08-31",
        "tags": "manufacturing, production, paper, factory, operations",
        "apply_link": "https://www.saramin.co.kr/zf_user/company-info/view-inner-recruit/csn/RHJGMjNZL3AyVVJBRHJiM2tyaE1Sdz09",
    },
    {
        "title": "무역진흥 청년인턴 (Trade Promotion Youth Intern)",
        "company": "대한무역투자진흥공사 (KOTRA) 전주",
        "location": "전주시 완산구, 전라북도",
        "type": "internship",
        "salary": "약 200만 원/월",
        "description": (
            "KOTRA 전주무역관 무역진흥 체험형 인턴을 모집합니다. "
            "중소기업 수출 지원 업무, 해외 바이어 발굴 조사, 무역 통계 분석, "
            "전북 수출기업 컨설팅 보조 업무를 담당합니다."
        ),
        "requirements": (
            "무역·국제경영·경제학 전공\n"
            "영어 비즈니스 문서 작성 가능\n"
            "D-2, D-4 비자 소지자 지원 가능"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-09-30",
        "tags": "trade, export, KOTRA, international business, consulting",
        "apply_link": "https://recruit.kotra.or.kr",
    },
    {
        "title": "방송제작 인턴 (Broadcasting Production Intern)",
        "company": "전주MBC",
        "location": "전주시 덕진구, 전라북도",
        "type": "internship",
        "salary": "협의",
        "description": (
            "전주MBC 방송제작팀 인턴을 모집합니다. "
            "뉴스 취재 보조, 영상 편집, 라디오·TV 프로그램 기획 지원 업무를 담당합니다. "
            "전북 지역 주요 방송사로 미디어·저널리즘 경험을 쌓기에 최적의 환경입니다."
        ),
        "requirements": (
            "신문방송·언론·미디어 관련 전공\n"
            "영상 편집 툴(프리미어 프로 등) 기초 가능자 우대\n"
            "창의적이고 적극적인 인재"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-08-31",
        "tags": "media, broadcasting, journalism, TV, content production",
        "apply_link": "https://www.imbc.com/broad/tv/culture/internship/",
    },
    {
        "title": "IT 네트워크 유지보수 인턴 (IT Network Support Intern)",
        "company": "전주비전테크",
        "location": "전주시 완산구, 전라북도",
        "type": "internship",
        "salary": "월 180~220만 원",
        "description": (
            "전주비전테크에서 PC·서버·네트워크 유지보수 인턴을 모집합니다. "
            "기업 고객사 IT 인프라 점검·수리, 네트워크 장비 설정·트러블슈팅, "
            "윈도우/리눅스 시스템 관리 보조 업무를 담당합니다."
        ),
        "requirements": (
            "컴퓨터공학·정보통신·전산 관련 전공\n"
            "Windows Server, Linux 기초 지식\n"
            "운전면허 소지자 우대"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-07-28",
        "tags": "IT, networking, PC maintenance, server, Windows, Linux",
        "apply_link": "https://www.work.go.kr/jeonju/infoPlace/empInfo/empInfoList.do?subNaviMenuCd=10200",
    },
    {
        "title": "정밀 베어링 생산기술 인턴 (Precision Bearing Manufacturing Intern)",
        "company": "셰플러코리아㈜ (Schaeffler Korea)",
        "location": "전주시 덕진구, 전라북도",
        "type": "internship",
        "salary": "협의",
        "description": (
            "글로벌 자동차 부품기업 셰플러코리아 전주공장 생산기술 인턴입니다. "
            "자동차용 베어링 생산공정 개선, 설비 데이터 분석, 품질 이상 대응 보조 업무를 담당합니다. "
            "셰플러 그룹은 독일 본사의 글로벌 자동차·산업용 정밀부품 전문기업입니다."
        ),
        "requirements": (
            "기계·산업공학·재료공학 전공\n"
            "CAD 기초 활용 가능자 우대\n"
            "D-2, D-4 비자 지원 가능"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-09-30",
        "tags": "automotive, bearings, precision manufacturing, engineering, German company",
        "apply_link": "https://www.schaeffler.com/ko_kr/career/",
    },
    {
        "title": "스타트업 육성 지원 인턴 (Startup Acceleration Intern)",
        "company": "전북창조경제혁신센터",
        "location": "전주시 완산구, 전라북도",
        "type": "internship",
        "salary": "약 180만 원/월",
        "description": (
            "전북창조경제혁신센터 스타트업 육성팀 인턴입니다. "
            "스타트업 멘토링 프로그램 운영 보조, IR 행사 기획·진행, "
            "창업 생태계 조사·분석 보고서 작성 업무를 담당합니다. "
            "전북 지역 혁신 창업 허브에서 다양한 스타트업과 함께 성장할 기회입니다."
        ),
        "requirements": (
            "경영·창업·IT 관련 전공\n"
            "기획·커뮤니케이션 능력 보유자\n"
            "스타트업·창업 에코시스템에 관심 있는 인재"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-08-31",
        "tags": "startup, entrepreneurship, innovation, business development, Jeonbuk",
        "apply_link": "https://ccei.creativekorea.or.kr/jeonbuk/",
    },
    {
        "title": "한국서부발전 체험형 인턴 (Power Engineering Intern)",
        "company": "한국서부발전㈜",
        "location": "전주, 전라북도",
        "type": "internship",
        "salary": "약 190만 원/월",
        "description": (
            "한국서부발전 전북 사업소 체험형 인턴을 모집합니다. "
            "발전소 운영 현장 견학·보조, 설비 점검 데이터 입력, "
            "신재생에너지 사업 운영 보조 업무를 담당합니다. "
            "공기업 발전 분야 경력을 시작하기에 좋은 기회입니다."
        ),
        "requirements": (
            "전기·기계·에너지공학 전공\n"
            "공기업 및 에너지 분야 관심자\n"
            "D-2, D-4 비자 소지자 지원 가능"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-09-30",
        "tags": "energy, power plant, engineering, public company, renewable energy",
        "apply_link": "https://www.kwepo.co.kr/kwepo/user/recruit/recruitMain.do",
    },
    {
        "title": "리테일 매니지먼트 트레이니 (Retail Management Trainee)",
        "company": "CJ올리브영 전주덕진점",
        "location": "전주시 덕진구, 전라북도",
        "type": "internship",
        "salary": "최저임금 이상, 근무시간별 협의",
        "description": (
            "CJ올리브영 전주덕진점 리테일 매니지먼트 트레이니 프로그램입니다. "
            "뷰티·헬스 상품 판매 및 고객 응대, 재고 관리·상품 진열, "
            "매장 운영 효율화 프로젝트 참여 기회를 제공합니다."
        ),
        "requirements": (
            "경영·유통·소비재 관련 전공 우대\n"
            "한국어 커뮤니케이션 가능자\n"
            "주말·공휴일 근무 가능자"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-07-31",
        "tags": "retail, beauty, health, management, customer service, CJ",
        "apply_link": "https://www.oliveyoung.com/store/main/getMypageHr.do",
    },
    {
        "title": "전북테크노파크 R&D 지원 인턴 (R&D Support Intern)",
        "company": "전북테크노파크",
        "location": "전주시 덕진구, 전라북도",
        "type": "internship",
        "salary": "약 190만 원/월",
        "description": (
            "전북테크노파크 R&D 지원팀 인턴입니다. "
            "중소·중견기업 기술개발 과제 관리 보조, 산업기술 트렌드 조사·보고서 작성, "
            "기술사업화 컨설팅 보조 업무를 담당합니다. "
            "전라북도 산업기술 혁신의 핵심 허브에서 일할 수 있는 기회입니다."
        ),
        "requirements": (
            "공학·자연과학·경영 관련 전공\n"
            "보고서 작성 및 데이터 분석 기초 능력\n"
            "D-2, D-4 비자 소지자 환영"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-08-31",
        "tags": "R&D, technology, research, SME support, innovation, technopark",
        "apply_link": "https://www.jtp.or.kr/main/sub01/sub01_05_01.do",
    },
    {
        "title": "SNS 마케팅 콘텐츠 인턴 (SNS Marketing & Content Intern)",
        "company": "㈜연을담다",
        "location": "전주시, 전라북도",
        "type": "internship",
        "salary": "월 190만 원 내외",
        "description": (
            "전주 로컬 브랜드 ㈜연을담다에서 SNS 마케팅·콘텐츠 디자인 인턴을 모집합니다. "
            "인스타그램·유튜브·네이버 블로그 콘텐츠 기획·제작, "
            "사진 촬영·영상 편집, 고객 커뮤니케이션 업무를 담당합니다."
        ),
        "requirements": (
            "디자인·미디어·마케팅 관련 전공\n"
            "Canva, Photoshop 또는 영상 편집 툴 기초 가능자\n"
            "SNS 트렌드에 민감하고 창의적인 인재"
        ),
        "visa_compatible": "D-2, D-4",
        "deadline": "2026-07-31",
        "tags": "marketing, SNS, content, design, social media, local brand",
        "apply_link": "https://www.jobkorea.co.kr/Recruit/GI_Read/49139589",
    },
]
