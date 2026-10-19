"""What a job means for an international student, read from its text.

* field / city: same rules as src/lib/job-filters.ts (jobCategory, jobCity),
  so alert emails match what the website's filters show. Keep them in sync.
* insights: hints shown as tags on job cards. They come from the posting's
  wording, so the website labels them as hints, not guarantees.
"""
import re

FIELD_RULES = [
    ("IT / Software", r"\b(software|developer|engineer|frontend|back-?end|full[-\s]?stack|data|ai|ml|devops|programmer|web\s?dev|app dev|ios|android|python|java|backend|qa)\b"),
    ("Design", r"design|designer|\bux\b|\bui\b|graphic|package design|illustrat"),
    ("Marketing", r"market|brand|campaign|influencer|growth|\bpr\b|content|\bsns\b|social media|advertis|creator|editor"),
    ("Sales", r"\bsales\b|b2b|b2c|account manager|business development|\bbd\b|\bmd\b|merchandis"),
    ("Research", r"research|\br&d\b|\blab\b|analyst|연구"),
    ("HR", r"\bhr\b|human resource|recruit|people team"),
    ("Business", r"plan|strateg|operation|management|scm|logistic|business|admin|financ|account|invest|staff"),
]
FIELDS = [f for f, _ in FIELD_RULES] + ["Other"]

CITY_ALIASES = [
    ("seoul", "Seoul"), ("서울", "Seoul"), ("jeonju", "Jeonju"), ("전주", "Jeonju"),
    ("busan", "Busan"), ("부산", "Busan"), ("incheon", "Incheon"), ("인천", "Incheon"),
    ("daejeon", "Daejeon"), ("대전", "Daejeon"), ("daegu", "Daegu"), ("대구", "Daegu"),
    ("gwangju", "Gwangju"), ("광주", "Gwangju"), ("ulsan", "Ulsan"), ("울산", "Ulsan"),
    ("sejong", "Sejong"), ("세종", "Sejong"), ("suwon", "Suwon"), ("수원", "Suwon"),
    ("seongnam", "Seongnam"), ("성남", "Seongnam"), ("pangyo", "Seongnam"), ("판교", "Seongnam"),
    ("yongin", "Yongin"), ("용인", "Yongin"), ("bucheon", "Bucheon"), ("부천", "Bucheon"),
    ("anyang", "Anyang"), ("안양", "Anyang"), ("hwaseong", "Hwaseong"), ("화성", "Hwaseong"),
    ("cheonan", "Cheonan"), ("천안", "Cheonan"), ("iksan", "Iksan"), ("익산", "Iksan"),
    ("gunsan", "Gunsan"), ("군산", "Gunsan"), ("pohang", "Pohang"), ("포항", "Pohang"),
    ("changwon", "Changwon"), ("창원", "Changwon"), ("gimhae", "Gimhae"), ("김해", "Gimhae"),
    ("jeju", "Jeju"), ("제주", "Jeju"),
]
REGION_ALIASES = [
    ("gyeonggi", "Gyeonggi"), ("경기", "Gyeonggi"),
    ("jeollabuk", "Jeollabuk-do"), ("전북", "Jeollabuk-do"), ("전라북도", "Jeollabuk-do"),
    ("jeollanam", "Jeollanam-do"), ("전남", "Jeollanam-do"), ("전라남도", "Jeollanam-do"),
    ("gangwon", "Gangwon"), ("강원", "Gangwon"),
    ("chungbuk", "Chungcheongbuk-do"), ("충북", "Chungcheongbuk-do"), ("충청북도", "Chungcheongbuk-do"),
    ("chungnam", "Chungcheongnam-do"), ("충남", "Chungcheongnam-do"), ("충청남도", "Chungcheongnam-do"),
    ("gyeongbuk", "Gyeongsangbuk-do"), ("경북", "Gyeongsangbuk-do"), ("경상북도", "Gyeongsangbuk-do"),
    ("gyeongnam", "Gyeongsangnam-do"), ("경남", "Gyeongsangnam-do"), ("경상남도", "Gyeongsangnam-do"),
]

_KOREAN_REQUIRED = re.compile(
    r"(fluent|native|business|proficient|advanced|excellent|required|must)[^.\n]{0,40}korean"
    r"|korean[^.\n]{0,40}(fluen|native|required|proficien|business[- ]level|must)"
    r"|topik\s*(level\s*)?[3-6]|한국어\s*(능통|가능|필수|원어민)",
    re.I,
)
_VISA_SUPPORT = re.compile(r"visa (sponsor|support)|sponsorship|\bE-?7\b|비자\s*(지원|스폰서)", re.I)
_STUDENT_ROLE = re.compile(r"intern|인턴|part[- ]time|아르바이트|student", re.I)


def job_field(title: str, description: str, tags) -> str:
    tag_text = " ".join(tags) if isinstance(tags, (list, tuple)) else (tags or "").replace(",", " ")
    h = f"{title or ''} {(description or '')[:140]} {tag_text}".lower()
    for name, pattern in FIELD_RULES:
        if re.search(pattern, h):
            return name
    return "Other"


def job_city(location: str) -> str:
    loc = (location or "").lower()
    if not loc.strip():
        return "Other"
    if "remote" in loc or "재택" in loc:
        return "Remote"
    for alias, canon in CITY_ALIASES + REGION_ALIASES:
        if alias in loc:
            return canon
    return "Other"


def insights(job) -> dict:
    """Hints for international students, from the full posting text."""
    text = " ".join(filter(None, [job.title, job.description, job.requirements, job.foreigner_note]))
    return {
        "korean_required": bool(_KOREAN_REQUIRED.search(text)),
        "english_ok": (job.foreigner_friendly or "").lower() == "yes",
        "visa_support": bool(_VISA_SUPPORT.search(text)),
        # D-2/D-4 students need a part-time work permit (시간제취업허가) for these.
        "student_role": (job.job_type or "").lower() in ("internship", "part-time") or bool(_STUDENT_ROLE.search(job.title or "")),
    }
