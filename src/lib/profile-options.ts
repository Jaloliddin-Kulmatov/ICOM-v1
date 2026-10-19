// Choices shared by the profile, job matching, alerts and the arrival checklist.
// Field and city names match lib/job-filters.ts and backend/job_insights.py.

export const JOB_FIELDS = ["IT / Software", "Marketing", "Design", "Sales", "Business", "Research", "HR"] as const;

export const CITIES = [
  "Seoul", "Seongnam", "Incheon", "Suwon", "Busan", "Daejeon", "Daegu", "Gwangju", "Jeonju",
  "Ulsan", "Sejong", "Cheonan", "Yongin", "Gyeonggi", "Jeju", "Remote",
] as const;

export const TOPIK_LEVELS = [
  { value: 0, label: "No TOPIK yet" },
  { value: 1, label: "TOPIK 1" }, { value: 2, label: "TOPIK 2" }, { value: 3, label: "TOPIK 3" },
  { value: 4, label: "TOPIK 4" }, { value: 5, label: "TOPIK 5" }, { value: 6, label: "TOPIK 6" },
];

// Arrival checklist. Ids match CHECKLIST_STEPS in backend/routes/auth.py.
export const ARRIVAL_STEPS = [
  { id: "arc",         title: "Apply for your ARC",           note: "Within 90 days of arriving. Book on HiKorea.",            href: "/guide/visa" },
  { id: "bank",        title: "Open a bank account",          note: "Bring your ARC, passport and Korean phone number.",       href: "/guide/banking" },
  { id: "insurance",   title: "Check your health insurance",  note: "Students are enrolled in NHIS. Know how to pay.",         href: "/guide/insurance" },
  { id: "phone",       title: "Get a Korean phone number",    note: "Needed for banking apps and verification.",               href: "/guide/living" },
  { id: "tmoney",      title: "Get a T-money card",           note: "Buses, subway and convenience stores.",                   href: "/guide/transport" },
  { id: "housing",     title: "Sort out housing",             note: "Dorm, goshiwon or one-room. Know your deposit.",          href: "/guide/housing" },
  { id: "work-permit", title: "Get a part-time work permit",  note: "Needed before any part-time job or internship on D-2.",   href: "/guide/visa" },
] as const;

/** Whole days from today (local time) until a YYYY-MM-DD date; null if not a date. */
export function daysUntil(isoDate?: string | null): number | null {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const [y, m, d] = isoDate.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}
