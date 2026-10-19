import type { Job, User } from "./types";

// Same rules as the website's src/lib/job-filters.ts. Keep them in sync.
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

const CITY: [string, string][] = [
  ["seoul", "Seoul"], ["서울", "Seoul"], ["jeonju", "Jeonju"], ["전주", "Jeonju"], ["busan", "Busan"], ["부산", "Busan"],
  ["incheon", "Incheon"], ["인천", "Incheon"], ["daejeon", "Daejeon"], ["대전", "Daejeon"], ["daegu", "Daegu"], ["대구", "Daegu"],
  ["gwangju", "Gwangju"], ["광주", "Gwangju"], ["ulsan", "Ulsan"], ["울산", "Ulsan"], ["sejong", "Sejong"], ["세종", "Sejong"],
  ["suwon", "Suwon"], ["수원", "Suwon"], ["seongnam", "Seongnam"], ["성남", "Seongnam"], ["pangyo", "Seongnam"], ["판교", "Seongnam"],
  ["gyeonggi", "Gyeonggi"], ["경기", "Gyeonggi"],
];
export function jobCity(job: Job): string {
  const loc = (job.location || "").toLowerCase();
  if (!loc.trim()) return "Other";
  if (loc.includes("remote") || loc.includes("재택")) return "Remote";
  for (const [alias, canon] of CITY) if (loc.includes(alias)) return canon;
  return "Other";
}

export function daysLeft(job: Job): number | null {
  const raw = (job.deadline || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return Math.floor((new Date(`${raw}T23:59:59`).getTime() - Date.now()) / 86_400_000);
}

export function matchScore(job: Job, u?: User | null): { score: number; reasons: string[] } {
  if (!u) return { score: 0, reasons: [] };
  let score = 0;
  const reasons: string[] = [];
  if (u.job_field && jobCategory(job) === u.job_field) { score += 3; reasons.push(u.job_field); }
  const city = jobCity(job);
  if (u.city && (city === u.city || city === "Remote")) { score += 2; reasons.push(city === "Remote" ? "Remote" : u.city); }
  const h = job.insights;
  if (h?.korean_required && (u.topik_level ?? 0) < 4) score -= 3;
  if (h?.english_ok || job.foreigner_friendly === "yes") score += 1;
  const visa = (u.visa_type || "").toUpperCase();
  if (h?.student_role && (visa.startsWith("D-2") || visa.startsWith("D-4"))) score += 1;
  if (h?.visa_support && visa.startsWith("D-10")) { score += 2; reasons.push("Visa support"); }
  return { score, reasons };
}

export function matchesSearch(job: Job, q: string): boolean {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = `${job.title} ${job.company} ${job.location} ${(job.tags || []).join(" ")} ${job.description}`.toLowerCase();
  return words.every((w) => hay.includes(w));
}
