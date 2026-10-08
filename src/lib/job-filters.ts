import type { Job } from "@/types";

// The listings are almost all internships, so employment-type tabs are useless.
// We derive the FIELD (IT, Marketing, Design, …) from the title/description/tags.
// Order matters — most specific first (a "data engineer" is IT, not Business).
export function jobCategory(job: Job): string {
  const h = `${job.title} ${(job.description || "").slice(0, 140)} ${(job.tags || []).join(" ")}`.toLowerCase();
  if (/\b(software|developer|engineer|frontend|back-?end|full[-\s]?stack|data|ai|ml|devops|programmer|web\s?dev|app dev|ios|android|python|java|backend|qa)\b/.test(h)) return "IT / Software";
  if (/design|designer|\bux\b|\bui\b|graphic|package design|illustrat/.test(h)) return "Design";
  if (/market|brand|campaign|influencer|growth|\bpr\b|content|\bsns\b|social media|advertis|creator|editor/.test(h)) return "Marketing";
  if (/\bsales\b|b2b|b2c|account manager|business development|\bbd\b|\bmd\b|merchandis/.test(h)) return "Sales";
  if (/research|\br&d\b|\blab\b|analyst|연구/.test(h)) return "Research";
  if (/\bhr\b|human resource|recruit|people team/.test(h)) return "HR";
  if (/plan|strateg|operation|management|scm|logistic|business|admin|financ|account|invest|staff/.test(h)) return "Business";
  return "Other";
}

// Map every location string to ONE canonical English city, matching English
// (any case) OR Korean aliases, so the Location menu is clean English.
const CITY_ALIASES: [string, string][] = [
  ["seoul", "Seoul"], ["서울", "Seoul"],
  ["jeonju", "Jeonju"], ["전주", "Jeonju"],
  ["busan", "Busan"], ["부산", "Busan"],
  ["incheon", "Incheon"], ["인천", "Incheon"],
  ["daejeon", "Daejeon"], ["대전", "Daejeon"],
  ["daegu", "Daegu"], ["대구", "Daegu"],
  ["gwangju", "Gwangju"], ["광주", "Gwangju"],
  ["ulsan", "Ulsan"], ["울산", "Ulsan"],
  ["sejong", "Sejong"], ["세종", "Sejong"],
  ["suwon", "Suwon"], ["수원", "Suwon"],
  ["seongnam", "Seongnam"], ["성남", "Seongnam"], ["pangyo", "Seongnam"], ["판교", "Seongnam"],
  ["yongin", "Yongin"], ["용인", "Yongin"],
  ["bucheon", "Bucheon"], ["부천", "Bucheon"],
  ["anyang", "Anyang"], ["안양", "Anyang"],
  ["hwaseong", "Hwaseong"], ["화성", "Hwaseong"],
  ["cheonan", "Cheonan"], ["천안", "Cheonan"],
  ["iksan", "Iksan"], ["익산", "Iksan"],
  ["gunsan", "Gunsan"], ["군산", "Gunsan"],
  ["pohang", "Pohang"], ["포항", "Pohang"],
  ["changwon", "Changwon"], ["창원", "Changwon"],
  ["gimhae", "Gimhae"], ["김해", "Gimhae"],
  ["jeju", "Jeju"], ["제주", "Jeju"],
];
const REGION_ALIASES: [string, string][] = [
  ["gyeonggi", "Gyeonggi"], ["경기", "Gyeonggi"],
  ["jeollabuk", "Jeollabuk-do"], ["전북", "Jeollabuk-do"], ["전라북도", "Jeollabuk-do"],
  ["jeollanam", "Jeollanam-do"], ["전남", "Jeollanam-do"], ["전라남도", "Jeollanam-do"],
  ["gangwon", "Gangwon"], ["강원", "Gangwon"],
  ["chungbuk", "Chungcheongbuk-do"], ["충북", "Chungcheongbuk-do"], ["충청북도", "Chungcheongbuk-do"],
  ["chungnam", "Chungcheongnam-do"], ["충남", "Chungcheongnam-do"], ["충청남도", "Chungcheongnam-do"],
  ["gyeongbuk", "Gyeongsangbuk-do"], ["경북", "Gyeongsangbuk-do"], ["경상북도", "Gyeongsangbuk-do"],
  ["gyeongnam", "Gyeongsangnam-do"], ["경남", "Gyeongsangnam-do"], ["경상남도", "Gyeongsangnam-do"],
];

export function jobCity(job: Job): string {
  const loc = (job.location || "").toLowerCase();
  if (!loc.trim()) return "Other";
  if (loc.includes("remote") || loc.includes("재택")) return "Remote";
  for (const [alias, canon] of CITY_ALIASES) if (loc.includes(alias)) return canon;
  for (const [alias, canon] of REGION_ALIASES) if (loc.includes(alias)) return canon;
  return "Other";
}

/** Days until the deadline (0 = today), or null for rolling / unparseable. */
export function daysLeft(job: Job): number | null {
  const raw = (job.deadline || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const end = new Date(`${raw}T23:59:59`);
  return Math.floor((end.getTime() - Date.now()) / 86_400_000);
}

/** Every word in the query must appear somewhere in the job (any order). */
export function matchesSearch(job: Job, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = [job.title, job.company, job.location, jobCity(job), jobCategory(job),
    (job.tags || []).join(" "), job.description].join(" ").toLowerCase();
  return words.every((w) => hay.includes(w));
}

export const SORTS = {
  newest: "Newest",
  closing: "Closing soon",
  popular: "Most applied",
  company: "Company A–Z",
} as const;
export type SortKey = keyof typeof SORTS;

export function sortJobs(jobs: Job[], sort: SortKey): Job[] {
  const copy = [...jobs];
  const posted = (j: Job) => new Date(j.postedAt).getTime() || 0;
  switch (sort) {
    case "closing":
      // Dated deadlines first (soonest first), then rolling ones by newest.
      return copy.sort((a, b) => {
        const da = daysLeft(a), db = daysLeft(b);
        if (da === null && db === null) return posted(b) - posted(a);
        if (da === null) return 1;
        if (db === null) return -1;
        return da - db;
      });
    case "popular":
      return copy.sort((a, b) => (b.applyCount || 0) - (a.applyCount || 0) || posted(b) - posted(a));
    case "company":
      return copy.sort((a, b) => a.company.localeCompare(b.company));
    default:
      return copy.sort((a, b) => posted(b) - posted(a));
  }
}
